from typing import List, Literal, Optional

from pydantic import BaseModel, Field

ThemePreference = Literal["light", "dark", "system"]

ALLOWED_SITES = {"linkedin", "indeed", "google"}


class AppSettings(BaseModel):
    theme: ThemePreference = "system"
    default_location: str = ""
    default_results_wanted: int = Field(default=20, ge=10, le=60)
    default_country_indeed: str = "india"
    default_sites: List[str] = Field(default_factory=list)


class AppSettingsUpdate(BaseModel):
    theme: Optional[ThemePreference] = None
    default_location: Optional[str] = None
    default_results_wanted: Optional[int] = Field(default=None, ge=10, le=60)
    default_country_indeed: Optional[str] = None
    default_sites: Optional[List[str]] = None

    def normalized(self) -> dict:
        payload = self.model_dump(exclude_none=True)

        if "default_location" in payload:
            payload["default_location"] = payload["default_location"].strip()

        if "default_country_indeed" in payload:
            payload["default_country_indeed"] = payload["default_country_indeed"].strip().lower()

        if "default_sites" in payload:
            payload["default_sites"] = [
                site for site in payload["default_sites"] if site in ALLOWED_SITES
            ]

        return payload
