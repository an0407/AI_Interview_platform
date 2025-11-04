# Use async Motor for all database operations instead of PyMongo
# This ensures consistency with the rest of the application

from app.database.mongo_db import get_database

# Note: These are synchronous references. For async operations, use get_database()
# This is kept for backward compatibility with existing code

def get_db():
    """Get the database instance - for use in async contexts"""
    return get_database()

# For backward compatibility - these should be accessed via async functions
# The actual collections will be retrieved dynamically from Motor
async def get_interview_collection():
    db = get_database()
    return db["interviews"]

async def get_conversation_collection():
    db = get_database()
    return db["conversations"]

# Legacy references - use the async versions above instead
interview_collection = None  # Will be set at runtime
conversation_collection = None  # Will be set at runtime
