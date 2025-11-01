from fastapi import APIRouter
from app.schemas.interview_schemas import AssignInterviewRequest
from app.services.interview_service import (
    assign_interview_service,
    get_all_interviews_service,
    get_interviews_by_employee_service,
    get_interviews_by_manager_service,
    get_interview_by_id_service,
)

router = APIRouter(prefix="/interviews", tags=["Interviews"])


@router.post("/assign")
def assign_interview(interview: AssignInterviewRequest):
    return assign_interview_service(interview)


@router.get("/")
def get_all_interviews():
    return get_all_interviews_service()

@router.get("/interviews/{interview_id}")
def get_interview_by_id(interview_id: str):
    """Fetch a single interview by its MongoDB _id"""
    return get_interview_by_id_service(interview_id)

@router.get("/employee/{employee_id}")
def get_interviews_by_employee(employee_id: str):
    return get_interviews_by_employee_service(employee_id)


@router.get("/manager/{manager_id}")
def get_interviews_by_manager(manager_id: str):
    return get_interviews_by_manager_service(manager_id)
