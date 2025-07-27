# backend/database.py
import motor.motor_asyncio
import os

import certifi

from dotenv import load_dotenv

load_dotenv() # Loads variables from .env file

ca = certifi.where()

MONGO_DETAILS = os.getenv("MONGO_CONNECTION_STRING") # Get this from MongoDB Atlas
client = motor.motor_asyncio.AsyncIOMotorClient(MONGO_DETAILS, tlsCAFile=ca) #
database = client.edugenie

quiz_results_collection = database.get_collection("quiz_results")
flashcard_sessions_collection = database.get_collection("flashcard_sessions")