from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.routes.user_routes import router as user_router
from app.routes.interview_routes import router as interview_routes_router
from app.routers.interview_eval import eval_router
from app.routers.interview_router import router as interview_router
from app.database.mongo_db import connect_to_mongo, close_mongo_connection
from app.core.config import settings
import logging
import os

logging.basicConfig(
    level=logging.INFO, 
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI(title="Interview Platform API")

# Allow frontend (React) to call backend APIs
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # your React app
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files directory for serving audio files
if os.path.exists("audios"):
    app.mount("/audios", StaticFiles(directory="audios"), name="audios")

@app.on_event("startup")
async def startup_db_client():
    await connect_to_mongo()

@app.on_event("shutdown")
async def shutdown_db_client():
    await close_mongo_connection()

app.include_router(user_router, prefix="/users", tags=["Users"])
app.include_router(interview_routes_router, prefix="/interviews", tags=["Interviews"])
app.include_router(interview_router, prefix="/interview", tags=["Interview"])
app.include_router(eval_router, prefix="/interview-eval", tags=["Interview Evaluation"])

@app.get("/")
def root():
    return {"message": "AI Interview Platform API is running!"}

@app.get("/health")
async def health():
    """Health check endpoint"""
    db = None
    try:
        from app.database.mongo_db import get_database
        db = get_database()
        # Try to ping the database
        await db.command("ping")

        # Count interviews
        interviews_count = await db["interviews"].count_documents({})
        users_count = await db["users"].count_documents({})

        return {
            "status": "healthy",
            "database": settings.DATABASE_NAME,
            "interviews_count": interviews_count,
            "users_count": users_count
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e)
        }

@app.get("/debug/all-interviews")
async def debug_all_interviews():
    """Debug endpoint to list all interviews"""
    try:
        from app.database.mongo_db import get_database
        db = get_database()
        interviews = await db["interviews"].find().to_list(None)

        result = []
        for interview in interviews:
            result.append({
                "_id": str(interview["_id"]),
                "interview_id": interview.get("interview_id"),
                "status": interview.get("status"),
                "manager_id": str(interview.get("manager_id")),
                "employee_ids": [str(eid) for eid in interview.get("employee_ids", [])]
            })

        return {"interviews": result, "count": len(result)}
    except Exception as e:
        return {
            "error": str(e),
            "type": type(e).__name__
        }