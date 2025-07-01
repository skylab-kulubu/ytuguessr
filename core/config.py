import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    DATABASE_URL = os.getenv("DATABASE_URL")
    JWT_SECRET = os.getenv("JWT_SECRET")
    LOCATION_COUNT = int(os.getenv("LOCATION_COUNT"))
    QUESTION_DURATION = int(os.getenv("QUESTION_DURATION"))
    ALPHA = float(os.getenv("ALPHA_COEFFICIENT"))
    BETA = float(os.getenv("BETA_COEFFICIENT"))
    LEADERBOARD_PAGE_SIZE = int(os.getenv("LEADERBOARD_PAGE_SIZE"))

settings = Settings()