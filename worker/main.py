import logging
import os
from fastapi import FastAPI, BackgroundTasks
from pydantic import BaseModel
import httpx

from processing.video import download_video, get_video_metadata, iter_frames
from processing.pose import extract_skeleton
from processing.features import compute_features
from processing.reps import detect_reps, filter_reps
from processing.normalize import normalize_reps
from processing.template import build_template
from processing.storage import upload_json

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Crousty Shape Worker")


class ProcessRequest(BaseModel):
    exerciseId: str
    videoUrl: str
    callbackUrl: str


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/process", status_code=202)
def process_video(req: ProcessRequest, background_tasks: BackgroundTasks):
    background_tasks.add_task(run_pipeline, req.exerciseId, req.videoUrl, req.callbackUrl)
    return {"message": "Processing started", "exerciseId": req.exerciseId}


async def run_pipeline(exercise_id: str, video_url: str, callback_url: str):
    try:
        logger.info(f"Starting processing for exercise {exercise_id}")

        # 1. Download video
        video_path = download_video(video_url)
        logger.info(f"Video downloaded: {video_path}")

        # 2. Read frames (streamed) and extract skeleton
        meta = get_video_metadata(video_path)
        skeleton = extract_skeleton(iter_frames(video_path, meta["skip"]), meta["fps"], meta["skip"])
        skeleton["metadata"] = {
            "fps": meta["fps"],
            "duration": meta["duration"],
            "resolution": meta["resolution"],
            "total_frames": meta["total_frames"],
        }
        os.unlink(video_path)
        logger.info(f"Skeleton extracted: {len(skeleton['frames'])} frames processed")

        # 3. Compute features
        features = compute_features(skeleton)
        logger.info(f"Features computed: {len(features['frames'])} frames")

        # 4. Detect and filter reps
        reps_data = detect_reps(features)
        logger.info(f"Reps detected: {reps_data['total_reps_detected']} (primary angle: {reps_data['primary_angle']})")

        reps_result = filter_reps(reps_data, features)
        logger.info(f"Valid reps: {reps_result['valid_reps_count']}/{reps_result['total_reps_detected']}")

        if reps_result["valid_reps_count"] == 0:
            raise Exception("No valid repetitions detected. The video may not contain a clear cyclic movement.")

        # 5. Normalize reps
        normalized = normalize_reps(reps_result, features)
        logger.info(f"Normalized {len(normalized)} reps to 100 points each")

        # 6. Build template
        template = build_template(normalized)
        template["primary_angle"] = reps_result["primary_angle"]
        logger.info(f"Template built from {template['n_reps_used']} reps")

        # 7. Upload results to Firebase Storage
        skeleton_url = upload_json(skeleton, f"skeletons/{exercise_id}.json")
        features_url = upload_json(features, f"features/{exercise_id}.json")
        reps_url = upload_json(reps_result, f"reps/{exercise_id}.json")
        template_url = upload_json(template, f"templates/{exercise_id}.json")
        logger.info(f"Results uploaded for exercise {exercise_id}")

        # 8. Callback to API
        async with httpx.AsyncClient() as client:
            await client.post(callback_url, json={
                "status": "READY",
                "skeletonUrl": skeleton_url,
                "featuresUrl": features_url,
                "repsUrl": reps_url,
                "templateUrl": template_url,
            })
        logger.info(f"Processing complete for exercise {exercise_id}")

    except Exception as e:
        logger.error(f"Processing failed for exercise {exercise_id}: {e}")
        try:
            async with httpx.AsyncClient() as client:
                await client.post(callback_url, json={
                    "status": "FAILED",
                    "error": str(e),
                })
        except Exception as cb_err:
            logger.error(f"Callback failed for exercise {exercise_id}: {cb_err}")
