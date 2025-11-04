from passlib.context import CryptContext
from app.database.mongo_db import get_database
from app.schemas.user_schema import User, UserCreate, LoginRequest
from fastapi import HTTPException
from datetime import datetime
from bson import ObjectId

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    password_bytes = password.encode('utf-8')
    password_bytes = password_bytes[:72]
    return pwd_context.hash(password_bytes)

def verify_password(plain_password, hashed_password):
    plain_password_bytes = plain_password.encode('utf-8')
    plain_password_bytes = plain_password_bytes[:72]
    return pwd_context.verify(plain_password_bytes, hashed_password)

async def create_user(user_data: UserCreate):
    db = get_database()
    user_collection = db["users"]

    existing_user = await user_collection.find_one({
        "$or": [{"user_id": user_data.user_id}, {"email": user_data.email}]
    })
    if existing_user:
        raise HTTPException(status_code=400, detail="User ID or Email already exists")

    hashed_password = hash_password(user_data.password)
    user_dict = user_data.dict()
    user_dict["password"] = hashed_password
    user_dict["created_at"] = datetime.utcnow().isoformat()

    result = await user_collection.insert_one(user_dict)
    new_user = await user_collection.find_one({"_id": result.inserted_id})
    new_user["_id"] = str(new_user["_id"])
    new_user.pop("password", None)
    return User(**new_user)

async def get_all_users():
    db = get_database()
    user_collection = db["users"]

    users = []
    async for document in user_collection.find():
        document["_id"] = str(document["_id"])
        document.pop("password", None)
        users.append(document)
    return users

async def login_user(email: str, password: str):
    db = get_database()
    user_collection = db["users"]

    user = await user_collection.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if not verify_password(password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid password")

    user["_id"] = str(user["_id"])
    user_data = {k: v for k, v in user.items() if k != "password"}
    return {"message": "Login successful", "role": user["role"], "user": user_data}

async def get_all_employees():
    db = get_database()
    user_collection = db["users"]

    employees = []
    async for document in user_collection.find({"role": "employee"}):
        document["_id"] = str(document["_id"])
        document.pop("password", None)
        employees.append(document)
    return employees