# This file is deprecated. Use app/database/mongo_db.py instead.
# This import is kept for backward compatibility only.

from app.database.mongo_db import get_database

# Get the async database instance
# Note: This should only be used in async context where MongoDB is already connected
async def get_db():
    return get_database()
