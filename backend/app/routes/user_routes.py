from fastapi import APIRouter
from app.config.db import db
from app.schemas.user_schema import User, UserCreate, LoginRequest
from app.services.user_service import create_user, get_all_users, login_user

router = APIRouter()

@router.post("/", response_model=User)
async def add_user(user: UserCreate):
    return await create_user(user)

@router.get("/", response_model=list[User])
async def list_users():
    return await get_all_users()

@router.post("/login")
async def login(login_data: LoginRequest):
    return await login_user(login_data.email, login_data.password)

@router.get("/employees")
async def get_all_employees():
    employees = await db["users"].find({"role": "employee"}, {"_id": 0}).to_list(None)
    return employees