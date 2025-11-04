from fastapi import APIRouter, Body
from pydantic import BaseModel
from app.schemas.interview_schemas import AssignInterviewRequest, Status
from app.services.interview_service import (
    assign_interview_service,
    get_all_interviews_service,
    get_interviews_by_employee_service,
    get_interviews_by_manager_service,
    get_interview_by_id_service,
    update_interview_status_service,
)

router = APIRouter()


class StatusUpdate(BaseModel):
    status: Status
    user_id: str = None  # Optional, will be extracted from interview if not provided


@router.post("/assign")
async def assign_interview(interview: AssignInterviewRequest):
    return await assign_interview_service(interview)


@router.get("/")
async def get_all_interviews():
    return await get_all_interviews_service()

@router.get("/{interview_id}")
async def get_interview_by_id(interview_id: str):
    """Fetch a single interview by its MongoDB _id"""
    return await get_interview_by_id_service(interview_id)

@router.get("/employee/{employee_id}")
async def get_interviews_by_employee(employee_id: str):
    return await get_interviews_by_employee_service(employee_id)


@router.get("/manager/{manager_id}")
async def get_interviews_by_manager(manager_id: str):
    return await get_interviews_by_manager_service(manager_id)


@router.put("/{interview_id}/status")
async def update_interview_status(interview_id: str, status_update: StatusUpdate = Body(...)):
    return await update_interview_status_service(interview_id, status_update.status, status_update.user_id)
