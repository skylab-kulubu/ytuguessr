import os
import json
from dotenv import load_dotenv

load_dotenv()

class Settings:
    POSTGRES_USER = os.getenv("POSTGRES_USER")
    POSTGRES_PASSWORD  = os.getenv("POSTGRES_PASSWORD")
    POSTGRES_DB = os.getenv("POSTGRES_DB")
    POSTGRES_HOST = os.getenv("POSTGRES_HOST")
    POSTGRES_PORT = int(os.getenv("POSTGRES_PORT"))
    ADMIN_SECRET = os.getenv("ADMIN_SECRET")
    JWT_SECRET = os.getenv("JWT_SECRET")
    LOCATION_COUNT = int(os.getenv("LOCATION_COUNT"))
    QUESTION_DURATION = int(os.getenv("QUESTION_DURATION"))
    ALPHA = float(os.getenv("ALPHA_COEFFICIENT"))
    BETA = float(os.getenv("BETA_COEFFICIENT"))
    LEADERBOARD_PAGE_SIZE = int(os.getenv("LEADERBOARD_PAGE_SIZE"))

    @property
    def DATABASE_URL(self):
        return (
            f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
            f"@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )
    
    @property
    def VALID_EMAILS(self):
        if not hasattr(self, "_valid_emails"):
            with open("mails.json", "r", encoding="utf-8") as f:
                self._valid_emails = set(json.load(f))
        return self._valid_emails

settings = Settings()