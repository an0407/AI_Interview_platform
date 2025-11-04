from bson import ObjectId, errors
from fastapi import HTTPException
from app.database.mongo_db import get_database
from app.core.email_service import send_email
from app.tasks.evaluation_tasks import trigger_evaluation
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


def serialize_interview(interview):
    interview["_id"] = str(interview["_id"])
    interview["manager_id"] = str(interview["manager_id"])
    interview["employee_ids"] = [str(eid) for eid in interview["employee_ids"]]
    return interview


async def assign_interview_service(interview):
    db = get_database()
    users_collection = db["users"]
    interviews_collection = db["interviews"]

    try:
        manager_oid = ObjectId(interview.manager_id)
        employee_oids = [ObjectId(eid) for eid in interview.employee_ids]
    except errors.InvalidId:
        raise HTTPException(status_code=400, detail="Invalid manager_id or employee_id format")

    manager = await users_collection.find_one({"_id": manager_oid})
    if not manager:
        raise HTTPException(status_code=404, detail="Manager not found")

    if manager.get("role", "").lower() != "manager":
        raise HTTPException(status_code=403, detail="Only managers can assign interviews")

    # Prepare interview document with UUID interview_id
    interview_doc = {
        "interview_id": interview.interview_id,
        "manager_id": manager_oid,
        "employee_ids": employee_oids,
        "interview_instructions": {
            "time": interview.interview_instructions.time,
            "tech_stacks": interview.interview_instructions.tech_stacks,
            "notes": interview.interview_instructions.notes,
        },
        "status": "assigned",  # Status value from Status enum
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat(),
    }

    logger.info(f"Creating interview with status: {interview_doc['status']}")

    result = await interviews_collection.insert_one(interview_doc)
    interview_doc["_id"] = str(result.inserted_id)

    # Send emails to employees
    employees = await users_collection.find({"_id": {"$in": employee_oids}}).to_list(None)
    for emp in employees:
        send_email(
            to_email=emp["email"],
            subject="Interview Assignment",
            body=(
                f"Hello {emp['name']},\n\n"
                f"You've been assigned an interview.\n"
                f"Time: {interview.interview_instructions.time}\n"
                f"Tech Stacks: {', '.join(interview.interview_instructions.tech_stacks)}\n"
                f"Notes: {interview.interview_instructions.notes or 'N/A'}\n\n"
                f"Assigned by: {manager['name']} ({manager['email']})\n"
            )
        )

    return {"message": "Interview assigned successfully to selected employees.", "interview_id": str(result.inserted_id)}


async def get_all_interviews_service():
    db = get_database()
    interviews_collection = db["interviews"]

    interviews = await interviews_collection.find().to_list(None)
    return [serialize_interview(i) for i in interviews]

async def get_interview_by_id_service(interview_id: str):
    db = get_database()
    interviews_collection = db["interviews"]

    try:
        interview_oid = ObjectId(interview_id)
        logger.info(f"Looking for interview with _id: {interview_oid}")

        interview = await interviews_collection.find_one({"_id": interview_oid})

        if not interview:
            logger.error(f"Interview not found with _id: {interview_oid}")
            raise HTTPException(status_code=404, detail="Interview not found")

        # Convert ObjectId fields to string
        interview["_id"] = str(interview["_id"])
        interview["manager_id"] = str(interview["manager_id"])
        interview["employee_ids"] = [str(eid) for eid in interview["employee_ids"]]
        return interview

    except errors.InvalidId as e:
        logger.error(f"Invalid interview ID format: {interview_id} - {str(e)}")
        raise HTTPException(status_code=400, detail="Invalid interview ID format")

async def get_interviews_by_employee_service(employee_id: str):
    db = get_database()
    interviews_collection = db["interviews"]

    try:
        emp_oid = ObjectId(employee_id)
    except errors.InvalidId:
        raise HTTPException(status_code=400, detail="Invalid employee ID format")

    interviews = await interviews_collection.find({"employee_ids": emp_oid}).to_list(None)
    logger.info(f"Found {len(interviews)} interviews for employee {employee_id}")

    for interview in interviews:
        logger.info(f"Interview _id: {interview['_id']}, Status: {interview.get('status', 'N/A')}")

    return [serialize_interview(i) for i in interviews]


async def get_interviews_by_manager_service(manager_id: str):
    db = get_database()
    interviews_collection = db["interviews"]

    try:
        mgr_oid = ObjectId(manager_id)
    except errors.InvalidId:
        raise HTTPException(status_code=400, detail="Invalid manager ID format")

    interviews = await interviews_collection.find({"manager_id": mgr_oid}).to_list(None)
    return [serialize_interview(i) for i in interviews]


async def update_interview_status_service(interview_id: str, status: str, user_id: str = None):
    db = get_database()
    interviews_collection = db["interviews"]

    try:
        interview_oid = ObjectId(interview_id)
    except errors.InvalidId:
        raise HTTPException(status_code=400, detail="Invalid interview ID format")

    # Get the interview to retrieve user_id if not provided
    if not user_id:
        interview = await interviews_collection.find_one({"_id": interview_oid})
        if not interview:
            raise HTTPException(status_code=404, detail="Interview not found")
        # For now, we'll use a placeholder. In a real system, user_id should be passed
        # from the endpoint context (the user completing the interview)
        user_id = str(interview.get("employee_ids", [None])[0])

    result = await interviews_collection.update_one(
        {"_id": interview_oid},
        {"$set": {"status": status, "updated_at": datetime.utcnow().isoformat()}}
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Interview not found")

    # Trigger automatic evaluation if status is being set to "completed"
    if status.lower() == "completed":
        logger.info(f"Interview {interview_id} marked as completed. Triggering evaluation...")
        await trigger_evaluation(interview_id, user_id)

    return {"message": "Interview status updated successfully."}
