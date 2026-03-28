import json

from database.connection import get_db
from models.app_settings import AppSettings


class SettingsService:
    def ensure_row(self):
        with get_db() as conn:
            conn.execute(
                """
                INSERT OR IGNORE INTO app_settings (
                    id,
                    theme,
                    default_location,
                    default_results_wanted,
                    default_country_indeed,
                    default_sites
                ) VALUES (1, 'system', '', 20, 'india', '[]')
                """
            )
            conn.commit()

    def get_settings(self) -> AppSettings:
        self.ensure_row()

        with get_db() as conn:
            row = conn.execute("SELECT * FROM app_settings WHERE id = 1").fetchone()

        return AppSettings(
            theme=row["theme"],
            default_location=row["default_location"] or "",
            default_results_wanted=row["default_results_wanted"],
            default_country_indeed=row["default_country_indeed"] or "india",
            default_sites=json.loads(row["default_sites"] or "[]"),
        )

    def update_settings(self, changes: dict) -> AppSettings:
        self.ensure_row()

        if not changes:
            return self.get_settings()

        assignments = []
        values = []

        for key, value in changes.items():
            assignments.append(f"{key} = ?")
            if key == "default_sites":
                values.append(json.dumps(value))
            else:
                values.append(value)

        assignments.append("updated_at = CURRENT_TIMESTAMP")
        values.append(1)

        with get_db() as conn:
            conn.execute(
                f"""
                UPDATE app_settings
                SET {", ".join(assignments)}
                WHERE id = ?
                """,
                values,
            )
            conn.commit()

        return self.get_settings()
