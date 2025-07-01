import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    POSTGRES_USER = os.getenv("POSTGRES_USER")
    POSTGRES_PASSWORD  = os.getenv("POSTGRES_PASSWORD")
    POSTGRES_DB = os.getenv("POSTGRES_DB")
    POSTGRES_HOST = os.getenv("POSTGRES_HOST")
    POSTGRES_PORT = int(os.getenv("POSTGRES_PORT"))
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

settings = Settings()