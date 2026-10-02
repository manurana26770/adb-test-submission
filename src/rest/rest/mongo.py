from django.conf import settings
from pymongo import MongoClient

client = MongoClient(
    host=settings.MONGO_HOST,
    port=settings.MONGO_PORT,
    serverSelectionTimeoutMS=settings.MONGO_TIMEOUT_MS,
    tz_aware=True,
)
db = client[settings.MONGO_DB_NAME]
