from passlib.context import CryptContext
from app.config.db import user_collection
from app.schemas.user_schema import User, UserCreate, LoginRequest
from fastapi import HTTPException

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    password = password[:72]
    return pwd_context.hash(password)

async def create_user(user_data: UserCreate):
    existing_user = await user_collection.find_one({
        "$or": [{"user_id": user_data.user_id}, {"email": user_data.email}]
    })
    if existing_user:
        raise HTTPException(status_code=400, detail="User ID or Email already exists")

    hashed_password = hash_password(user_data.password)
    user_dict = user_data.dict()
    user_dict["password"] = hashed_password

    result = await user_collection.insert_one(user_dict)
    new_user = await user_collection.find_one({"_id": result.inserted_id})
    new_user["_id"] = str(new_user["_id"])
    return User(**new_user)

async def get_all_users():
    users = []
    async for document in user_collection.find():
        document["_id"] = str(document["_id"])
        document.pop("password", None)
        users.append(document)
    return users

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password[:72], hashed_password)

async def login_user(email: str, password: str):
    user = await user_collection.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if not verify_password(password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid password")

    user["_id"] = str(user["_id"])
    user.pop("password", None)
    return {"message": "Login successful", "role": user["role"], "user": user}

async def get_all_employees():
    employees = []
    async for document in user_collection.find({"role": "employee"}):
        document["_id"] = str(document["_id"])
        document.pop("password", None)
        employees.append(document)
    return employees
