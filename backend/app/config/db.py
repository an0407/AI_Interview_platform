from motor.motor_asyncio import AsyncIOMotorClient

MONGO_URL = "mongodb+srv://homework_ai_dev:homework_ai_dev@homework-assistant-dev.g6aymho.mongodb.net/?retryWrites=true&w=majority"
client = AsyncIOMotorClient(MONGO_URL)
db = client["ai_interview_platform"]

# Define collection
user_collection = db["users"]
