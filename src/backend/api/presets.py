from typing import List

from fastapi import APIRouter, HTTPException

from models.preset import Preset, PresetCreate, PresetSummary
from services.preset_service import PresetService

router = APIRouter(prefix="/api/presets", tags=["presets"])

preset_service = PresetService()


@router.get("/", response_model=List[PresetSummary])
async def get_presets():
    try:
        return preset_service.get_all_presets()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{preset_id}", response_model=Preset)
async def get_preset(preset_id: str):
    try:
        preset = preset_service.get_preset(preset_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    if not preset:
        raise HTTPException(status_code=404, detail="Preset not found")

    return preset


@router.post("/", response_model=Preset, status_code=201)
async def create_preset(payload: PresetCreate):
    try:
        return preset_service.create_preset(payload)
    except ValueError as e:
        raise HTTPException(status_code=409, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{preset_id}/use")
async def mark_preset_used(preset_id: str):
    preset = preset_service.get_preset(preset_id)
    if not preset:
        raise HTTPException(status_code=404, detail="Preset not found")

    try:
        preset_service.update_preset_usage(preset_id)
        return {"ok": True, "preset_id": preset_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{preset_id}")
async def delete_preset(preset_id: str):
    try:
        deleted = preset_service.delete_preset(preset_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    if not deleted:
        raise HTTPException(status_code=404, detail="Preset not found")

    return {"ok": True, "preset_id": preset_id}
