from fastapi import FastAPI
from app.routes import interview_routes

app = FastAPI(title="Interview Platform API")

app.include_router(interview_routes.router)

@app.get("/")
def root():
    return {"message": "Interview Platform API is running 🚀"}
