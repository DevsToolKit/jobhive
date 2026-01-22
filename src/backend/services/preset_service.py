import uuid
import json
from typing import List, Optional
from datetime import datetime

from database.connection import get_db
from models.preset import Preset, PresetCreate, PresetSummary

class PresetService:
    
    def create_preset(self, preset_data: PresetCreate) -> Preset:
        """Create a new preset"""
        preset_id = str(uuid.uuid4())
        
        with get_db() as conn:
            cursor = conn.cursor()
            
            # Check if name already exists
            cursor.execute("SELECT id FROM presets WHERE name = ?", (preset_data.name,))
            if cursor.fetchone():
                raise ValueError(f"Preset with name '{preset_data.name}' already exists")
            
            cursor.execute("""
                INSERT INTO presets (id, name, search_term, location, config)
                VALUES (?, ?, ?, ?, ?)
            """, (
                preset_id,
                preset_data.name,
                preset_data.search_term,
                preset_data.location,
                json.dumps(preset_data.config)
            ))
            conn.commit()
            
            # Fetch and return created preset
            cursor.execute("SELECT * FROM presets WHERE id = ?", (preset_id,))
            row = cursor.fetchone()
            
            return Preset(
                id=row['id'],
                name=row['name'],
                search_term=row['search_term'],
                location=row['location'],
                config=json.loads(row['config']),
                created_at=datetime.fromisoformat(row['created_at']),
                last_used=datetime.fromisoformat(row['last_used']) if row['last_used'] else None,
                use_count=row['use_count']
            )
    
    def get_all_presets(self) -> List[PresetSummary]:
        """Get all presets"""
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT id, name, search_term, location, use_count, last_used
                FROM presets
                ORDER BY last_used DESC NULLS LAST, name ASC
            """)
            
            rows = cursor.fetchall()
            
            return [
                PresetSummary(
                    id=row['id'],
                    name=row['name'],
                    search_term=row['search_term'],
                    location=row['location'],
                    use_count=row['use_count'],
                    last_used=datetime.fromisoformat(row['last_used']) if row['last_used'] else None
                )
                for row in rows
            ]
    
    def get_preset(self, preset_id: str) -> Optional[Preset]:
        """Get a specific preset"""
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM presets WHERE id = ?", (preset_id,))
            row = cursor.fetchone()
            
            if not row:
                return None
            
            return Preset(
                id=row['id'],
                name=row['name'],
                search_term=row['search_term'],
                location=row['location'],
                config=json.loads(row['config']),
                created_at=datetime.fromisoformat(row['created_at']),
                last_used=datetime.fromisoformat(row['last_used']) if row['last_used'] else None,
                use_count=row['use_count']
            )
    
    def update_preset_usage(self, preset_id: str):
        """Update last_used and use_count when preset is used"""
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                UPDATE presets
                SET last_used = CURRENT_TIMESTAMP, use_count = use_count + 1
                WHERE id = ?
            """, (preset_id,))
            conn.commit()
    
    def delete_preset(self, preset_id: str) -> bool:
        """Delete a preset"""
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM presets WHERE id = ?", (preset_id,))
            conn.commit()
            return cursor.rowcount > 0