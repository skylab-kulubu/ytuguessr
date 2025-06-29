import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    JWT_SECRET = os.getenv("JWT_SECRET")
    LOCATION_COUNT = int(os.getenv("LOCATION_COUNT"))
    QUESTION_DURATION = int(os.getenv("QUESTION_DURATION"))
    ALPHA = float(os.getenv("ALPHA_COEFFICIENT"))
    BETA = float(os.getenv("BETA_COEFFICIENT"))

settings = Settings()