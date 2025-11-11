from fastapi import APIRouter, HTTPException
from livekit.api import AccessToken, VideoGrants
from app.core.config import settings

router = APIRouter(tags=["LiveKit"])

@router.get("/token")
async def get_livekit_token(user_name: str, interview_id: str):
    """
    Generates a LiveKit access token for a given interview session.
    """
    if not settings.LIVEKIT_API_KEY or not settings.LIVEKIT_API_SECRET:
        raise HTTPException(status_code=500, detail="LiveKit API key or secret not set")

    try:
        token = (
            AccessToken(settings.LIVEKIT_API_KEY, settings.LIVEKIT_API_SECRET)
            .with_identity(user_name)
            .with_name(f"Interview-{interview_id}")
            .with_grants(
                VideoGrants(
                    room_join=True,
                    room=f"interview_{interview_id}",
                    can_publish=True,
                    can_subscribe=True,
                )
            )
        )
        return {"token": token.to_jwt()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
