"""
Migration script to convert relative audio paths to absolute paths in database.
This fixes the issue where evaluation service couldn't find audio files due to
relative path resolution issues from different working directories.
"""

import asyncio
import os
import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.database.mongo_db import get_database


async def fix_audio_paths():
    """
    Converts all relative audio paths to absolute paths in the database.
    """
    db = get_database()
    conversations_collection = db["conversations"]

    print("Starting audio path migration...")

    # Find all documents with conversations
    documents = await conversations_collection.find({}).to_list(None)

    if not documents:
        print("No conversation documents found.")
        return

    print(f"Found {len(documents)} conversation documents")

    updated_count = 0

    for doc in documents:
        document_id = doc.get("_id")
        conversation = doc.get("conversation", [])

        if not conversation:
            continue

        needs_update = False

        # Process each turn in the conversation
        for turn in conversation:
            answer_audio_path = turn.get("answer_audio_path")

            # Check if path needs to be converted
            if answer_audio_path and not os.path.isabs(answer_audio_path):
                # Convert relative path to absolute
                abs_path = os.path.abspath(answer_audio_path)
                turn["answer_audio_path"] = abs_path
                needs_update = True
                print(f"  Updated answer audio path: {answer_audio_path} -> {abs_path}")

        # Update the document if changes were made
        if needs_update:
            await conversations_collection.replace_one(
                {"_id": document_id},
                doc
            )
            updated_count += 1
            print(f"  ✓ Document {document_id} updated")

    print(f"\nMigration complete!")
    print(f"Updated {updated_count} documents with absolute paths")

    if updated_count == 0:
        print("All audio paths are already absolute or no relative paths found.")


async def main():
    try:
        await fix_audio_paths()
        print("\n✅ Migration successful!")
    except Exception as e:
        print(f"\n❌ Migration failed: {e}")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
