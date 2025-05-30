import os
from typing import List
from pydantic_settings import BaseSettings
from pydantic import Field
import json

class Settings(BaseSettings):
    # API Configuration
    apify_api_token: str = ""
    notion_token: str = ""
    notion_database_id: str = ""
    
    # Google Sheets
    google_sheets_credentials: dict = Field(default_factory=dict)
    
    # Security
    secret_key: str = "fallback-secret-key-change-in-production"
    allowed_origins: List[str] = Field(default=["http://localhost:5000", "http://0.0.0.0:5000"])
    
    # Rate Limiting
    rate_limit_requests: int = 10
    rate_limit_window: int = 60
    
    # Logging
    log_level: str = "INFO"
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        
        # Parse Google Sheets credentials from env
        creds_json = os.getenv("GOOGLE_SHEETS_CREDENTIALS", "{}")
        try:
            if creds_json and creds_json != "{}":
                self.google_sheets_credentials = json.loads(creds_json)
        except json.JSONDecodeError:
            self.google_sheets_credentials = {}
        
        # Parse allowed origins from env if provided
        origins_env = os.getenv("ALLOWED_ORIGINS", "")
        if origins_env:
            self.allowed_origins = [origin.strip() for origin in origins_env.split(",")]

settings = Settings()
