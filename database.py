import os
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

# load_dotenv() reads the .env file in the project root and injects its
# key=value pairs into the process environment, so os.getenv() can see them.
load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")
DB_NAME = os.getenv("DB_NAME")

if not MONGO_URI or not DB_NAME:
    # Fail loudly at startup rather than silently connecting to nothing.
    raise RuntimeError(
        "MONGO_URI or DB_NAME is missing. Copy .env.example to .env "
        "and fill in your real MongoDB credentials."
    )

# AsyncIOMotorClient is the async MongoDB driver client — it doesn't block
# the event loop while waiting on network I/O, which matters in FastAPI
# since FastAPI itself is async.
client = AsyncIOMotorClient(MONGO_URI)

# Grab a handle to the specific database within the cluster.
database = client[DB_NAME]

# Grab a handle to the "products" collection (Mongo's equivalent of a table).
# It's created automatically the first time you insert a document into it —
# no separate "CREATE TABLE" step like in MySQL.
product_collection = database["products"]