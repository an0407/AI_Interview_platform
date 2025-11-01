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
