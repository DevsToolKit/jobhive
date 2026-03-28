from fastapi import APIRouter, HTTPException

from models.app_settings import AppSettings, AppSettingsUpdate
from services.settings_service import SettingsService

router = APIRouter(prefix="/api/settings", tags=["settings"])

settings_service = SettingsService()


@router.get("/", response_model=AppSettings)
async def get_settings():
    try:
        return settings_service.get_settings()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/", response_model=AppSettings)
async def update_settings(payload: AppSettingsUpdate):
    try:
        return settings_service.update_settings(payload.normalized())
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
