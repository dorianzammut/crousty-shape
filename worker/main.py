import logging
from fastapi import FastAPI, BackgroundTasks
from pydantic import BaseModel
import httpx

from processing.video import download_video, read_frames
from processing.pose import extract_skeleton
from processing.features import compute_features
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

        # 2. Read frames and extract skeleton
        frames_data = read_frames(video_path)
        skeleton = extract_skeleton(frames_data["frames"], frames_data["fps"], frames_data["skip"])
        skeleton["metadata"] = {
            "fps": frames_data["fps"],
            "duration": frames_data["duration"],
            "resolution": frames_data["resolution"],
            "total_frames": frames_data["total_frames"],
        }
        logger.info(f"Skeleton extracted: {len(skeleton['frames'])} frames processed")

        # 3. Compute features
        features = compute_features(skeleton)
        logger.info(f"Features computed: {len(features['frames'])} frames")

        # 4. Upload results to Firebase Storage
        skeleton_url = upload_json(skeleton, f"skeletons/{exercise_id}.json")
        features_url = upload_json(features, f"features/{exercise_id}.json")
        logger.info(f"Results uploaded for exercise {exercise_id}")

        # 5. Callback to API
        async with httpx.AsyncClient() as client:
            await client.post(callback_url, json={
                "status": "READY",
                "skeletonUrl": skeleton_url,
                "featuresUrl": features_url,
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
