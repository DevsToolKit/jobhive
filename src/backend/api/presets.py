from fastapi import APIRouter, HTTPException
from typing import List

from models.preset import Preset, PresetCreate, PresetSummary
from services.preset_service import PresetService

router = APIRouter(prefix="/api/presets", tags=["presets"])

preset_service = PresetService()


@router.post("/", response_model=Preset)
async def create_preset(preset: PresetCreate):
    """Create a new preset"""
    try:
        return preset_service.create_preset(preset)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/", response_model=List[PresetSummary])
async def get_all_presets():
    """Get all presets"""
    return preset_service.get_all_presets()


@router.get("/{preset_id}", response_model=Preset)
async def get_preset(preset_id: str):
    """Get a specific preset"""
    preset = preset_service.get_preset(preset_id)
    if not preset:
        raise HTTPException(status_code=404, detail="Preset not found")
    return preset


@router.delete("/{preset_id}")
async def delete_preset(preset_id: str):
    """Delete a preset"""
    success = preset_service.delete_preset(preset_id)
    if not success:
        raise HTTPException(status_code=404, detail="Preset not found")
    return {"message": "Preset deleted successfully"}


@router.post("/{preset_id}/use")
async def use_preset(preset_id: str):
    """Mark preset as used (updates last_used and use_count)"""
    preset = preset_service.get_preset(preset_id)
    if not preset:
        raise HTTPException(status_code=404, detail="Preset not found")
    
    preset_service.update_preset_usage(preset_id)
    return {"message": "Preset usage recorded", "config": preset.config}