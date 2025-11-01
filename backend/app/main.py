from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes.user_routes import router as user_router

app = FastAPI()

# ✅ Allow frontend (React) to call backend APIs
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # your React app
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(user_router, prefix="/users", tags=["Users"])

@app.get("/")
def root():
    return {"message": "Backend running successfully!"}
from fastapi import FastAPI
from app.routers.interview_eval import eval_router
from app.database.mongo_db import connect_to_mongo, close_mongo_connection
import logging


logging.basicConfig(
    level=logging.INFO, 
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)

app = FastAPI()

logger.info("Starting the FastAPI application.")

app.include_router(eval_router, prefix="/interview-eval", tags=["Interview Evaluation"])



@app.on_event("startup")
async def startup_db_client():
    await connect_to_mongo()

@app.on_event("shutdown")
async def shutdown_db_client():
    await close_mongo_connection()