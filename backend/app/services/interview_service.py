from bson import ObjectId, errors
from fastapi import HTTPException
from app.models.user_model import users_collection
from app.models.interview_model import interviews_collection
from app.core.email_service import send_email


def serialize_interview(interview):
    interview["_id"] = str(interview["_id"])
    interview["manager_id"] = str(interview["manager_id"])
    interview["employee_ids"] = [str(eid) for eid in interview["employee_ids"]]
    return interview


def assign_interview_service(interview):
    try:
        manager_oid = ObjectId(interview.manager_id)
        employee_oids = [ObjectId(eid) for eid in interview.employee_ids]
    except errors.InvalidId:
        raise HTTPException(status_code=400, detail="Invalid manager_id or employee_id format")

    manager = users_collection.find_one({"_id": manager_oid})
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
    }

    interviews_collection.insert_one(interview_doc)

    employees = users_collection.find({"_id": {"$in": employee_oids}})
    for emp in employees:
        send_email(
            to_email=emp["email"],
            subject="Interview Assignment",
            body=(
                f"Hello {emp['name']},\n\n"
                f"You’ve been assigned an interview.\n"
                f"Time: {interview.interview_instructions.time}\n"
                f"Tech Stacks: {', '.join(interview.interview_instructions.tech_stacks)}\n"
                f"Notes: {interview.interview_instructions.notes or 'N/A'}\n\n"
                f"Assigned by: {manager['name']} ({manager['email']})\n"
            )
        )

    return {"message": "Interview assigned successfully to selected employees."}


def get_all_interviews_service():
    interviews = list(interviews_collection.find())
    return [serialize_interview(i) for i in interviews]

def get_interview_by_id_service(interview_id: str):
    try:
        interview = interviews_collection.find_one({"_id": ObjectId(interview_id)})
        if not interview:
            raise HTTPException(status_code=404, detail="Interview not found")

        # Convert ObjectId fields to string
        interview["_id"] = str(interview["_id"])
        interview["manager_id"] = str(interview["manager_id"])
        interview["employee_ids"] = [str(eid) for eid in interview["employee_ids"]]
        return interview

    except Exception:
        raise HTTPException(status_code=400, detail="Invalid interview ID format")

def get_interviews_by_employee_service(employee_id: str):
    try:
        emp_oid = ObjectId(employee_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid employee ID format")

    interviews = list(interviews_collection.find({"employee_ids": emp_oid}))
    return [serialize_interview(i) for i in interviews]


def get_interviews_by_manager_service(manager_id: str):
    try:
        mgr_oid = ObjectId(manager_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid manager ID format")

    interviews = list(interviews_collection.find({"manager_id": mgr_oid}))
    return [serialize_interview(i) for i in interviews]
