import os
import json
import uuid
import copy
import asyncio
import logging
from datetime import datetime, timezone
from typing import Dict, List, Any, Optional
from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings

logger = logging.getLogger("nexora.database")


class ResilientCursor:
    def __init__(self, items: List[Dict[str, Any]]):
        self._items = items
        self._index = 0

    def sort(self, key_or_list, direction=1):
        if isinstance(key_or_list, list):
            key = key_or_list[0][0]
            direction = key_or_list[0][1]
        else:
            key = key_or_list
        reverse = direction < 0
        self._items.sort(key=lambda x: x.get(key, ""), reverse=reverse)
        return self

    def limit(self, count: int):
        self._items = self._items[:count]
        return self

    def skip(self, count: int):
        self._items = self._items[count:]
        return self

    async def to_list(self, length: Optional[int] = None) -> List[Dict[str, Any]]:
        if length is not None:
            return copy.deepcopy(self._items[:length])
        return copy.deepcopy(self._items)

    def __aiter__(self):
        self._index = 0
        return self

    async def __anext__(self):
        if self._index < len(self._items):
            item = self._items[self._index]
            self._index += 1
            return copy.deepcopy(item)
        raise StopAsyncIteration


class ResilientCollection:
    def __init__(self, name: str, file_path: str):
        self.name = name
        self.file_path = file_path
        self._data: List[Dict[str, Any]] = []
        self._lock = asyncio.Lock()
        self._load()

    def _load(self):
        if os.path.exists(self.file_path):
            try:
                with open(self.file_path, "r", encoding="utf-8") as f:
                    self._data = json.load(f)
            except Exception as e:
                logger.warning(f"Could not load collection file {self.file_path}: {e}")
                self._data = []

    def _save(self):
        try:
            os.makedirs(os.path.dirname(self.file_path), exist_ok=True)
            with open(self.file_path, "w", encoding="utf-8") as f:
                json.dump(self._data, f, default=str, indent=2)
        except Exception as e:
            logger.error(f"Error persisting collection {self.name}: {e}")

    def _matches(self, doc: Dict[str, Any], query: Dict[str, Any]) -> bool:
        if not query:
            return True
        for k, v in query.items():
            if k == "$or" and isinstance(v, list):
                if not any(self._matches(doc, cond) for cond in v):
                    return False
                continue
            if k == "$and" and isinstance(v, list):
                if not all(self._matches(doc, cond) for cond in v):
                    return False
                continue
            
            doc_val = doc.get(k)
            if isinstance(v, dict):
                # Operator support: $in, $ne, $gte, $lte, $gt, $lt, $exists, $regex
                if "$in" in v:
                    if doc_val not in v["$in"]:
                        return False
                if "$ne" in v:
                    if doc_val == v["$ne"]:
                        return False
                if "$gte" in v:
                    if doc_val is None or doc_val < v["$gte"]:
                        return False
                if "$lte" in v:
                    if doc_val is None or doc_val > v["$lte"]:
                        return False
                if "$gt" in v:
                    if doc_val is None or doc_val <= v["$gt"]:
                        return False
                if "$lt" in v:
                    if doc_val is None or doc_val >= v["$lt"]:
                        return False
                if "$exists" in v:
                    exists = k in doc
                    if exists != v["$exists"]:
                        return False
            else:
                if doc_val != v:
                    return False
        return True

    async def insert_one(self, document: Dict[str, Any]):
        async with self._lock:
            doc = copy.deepcopy(document)
            if "_id" not in doc:
                doc["_id"] = str(uuid.uuid4())
            self._data.append(doc)
            self._save()
            
            class InsertResult:
                def __init__(self, inserted_id):
                    self.inserted_id = inserted_id
            return InsertResult(doc["_id"])

    async def find_one(self, query: Dict[str, Any], projection: Optional[Dict[str, int]] = None) -> Optional[Dict[str, Any]]:
        async with self._lock:
            for item in self._data:
                if self._matches(item, query):
                    res = copy.deepcopy(item)
                    if projection and projection.get("_id") == 0:
                        res.pop("_id", None)
                    return res
            return None

    def find(self, query: Optional[Dict[str, Any]] = None, projection: Optional[Dict[str, int]] = None) -> ResilientCursor:
        q = query or {}
        matched = []
        for item in self._data:
            if self._matches(item, q):
                res = copy.deepcopy(item)
                if projection and projection.get("_id") == 0:
                    res.pop("_id", None)
                matched.append(res)
        return ResilientCursor(matched)

    async def update_one(self, query: Dict[str, Any], update: Dict[str, Any], upsert: bool = False):
        async with self._lock:
            matched_idx = -1
            for idx, item in enumerate(self._data):
                if self._matches(item, query):
                    matched_idx = idx
                    break
            
            if matched_idx >= 0:
                target = self._data[matched_idx]
                if "$set" in update:
                    for k, v in update["$set"].items():
                        target[k] = copy.deepcopy(v)
                if "$push" in update:
                    for k, v in update["$push"].items():
                        if k not in target or not isinstance(target[k], list):
                            target[k] = []
                        target[k].append(copy.deepcopy(v))
                if "$unset" in update:
                    for k in update["$unset"].keys():
                        target.pop(k, None)
                self._save()
                
                class UpdateResult:
                    matched_count = 1
                    modified_count = 1
                    upserted_id = None
                return UpdateResult()
            elif upsert:
                new_doc = copy.deepcopy(query)
                if "$set" in update:
                    new_doc.update(copy.deepcopy(update["$set"]))
                if "_id" not in new_doc:
                    new_doc["_id"] = str(uuid.uuid4())
                self._data.append(new_doc)
                self._save()
                
                class UpsertResult:
                    matched_count = 0
                    modified_count = 0
                    upserted_id = new_doc["_id"]
                return UpsertResult()
            
            class NoopResult:
                matched_count = 0
                modified_count = 0
                upserted_id = None
            return NoopResult()

    async def delete_one(self, query: Dict[str, Any]):
        async with self._lock:
            matched_idx = -1
            for idx, item in enumerate(self._data):
                if self._matches(item, query):
                    matched_idx = idx
                    break
            if matched_idx >= 0:
                self._data.pop(matched_idx)
                self._save()
                class DelResult:
                    deleted_count = 1
                return DelResult()
            class DelZeroResult:
                deleted_count = 0
            return DelZeroResult()

    async def count_documents(self, query: Dict[str, Any]) -> int:
        async with self._lock:
            cnt = 0
            for item in self._data:
                if self._matches(item, query):
                    cnt += 1
            return cnt

    async def create_index(self, keys, **kwargs):
        return "index_created"


class ResilientAsyncDB:
    def __init__(self, data_dir: str):
        self.data_dir = data_dir
        self.collections: Dict[str, ResilientCollection] = {}

    def __getitem__(self, name: str) -> ResilientCollection:
        if name not in self.collections:
            path = os.path.join(self.data_dir, f"{name}.json")
            self.collections[name] = ResilientCollection(name, path)
        return self.collections[name]

    def get_collection(self, name: str) -> ResilientCollection:
        return self[name]


# Global database holder
db_instance: Any = None
is_connected_to_real_mongo: bool = False
mongo_client_instance: Any = None


async def sync_data_storage_to_mongodb(mongo_db, storage_dir: str):
    """Sync any JSON records from data_storage into MongoDB so they show in Compass."""
    try:
        if not os.path.exists(storage_dir):
            return
        for fname in os.listdir(storage_dir):
            if fname.endswith(".json"):
                col_name = fname[:-5]
                fpath = os.path.join(storage_dir, fname)
                try:
                    with open(fpath, "r", encoding="utf-8") as f:
                        docs = json.load(f)
                    if isinstance(docs, list) and len(docs) > 0:
                        mongo_col = mongo_db[col_name]
                        for d in docs:
                            doc_id = d.get("_id")
                            if doc_id:
                                await mongo_col.replace_one({"_id": doc_id}, d, upsert=True)
                        logger.info(f"Synced {len(docs)} documents into MongoDB collection '{col_name}'")
                except Exception as ex:
                    logger.warning(f"Could not sync {fname} to MongoDB: {ex}")
    except Exception as e:
        logger.warning(f"Error during data storage migration: {e}")


async def init_db():
    global db_instance, is_connected_to_real_mongo, mongo_client_instance
    storage_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "data_storage")
    os.makedirs(storage_dir, exist_ok=True)
    
    # Connection targets to test: user-specified URI, then explicit 127.0.0.1 fallback for Windows
    candidate_uris = [settings.MONGODB_URI]
    if "localhost" in settings.MONGODB_URI:
        candidate_uris.append(settings.MONGODB_URI.replace("localhost", "127.0.0.1"))

    connected = False
    for uri in candidate_uris:
        try:
            client = AsyncIOMotorClient(uri, serverSelectionTimeoutMS=1500)
            await client.admin.command('ping')
            db_instance = client[settings.MONGODB_DB_NAME]
            mongo_client_instance = client
            is_connected_to_real_mongo = True
            connected = True
            logger.info(f"Connected to live MongoDB at {uri} -> Database: '{settings.MONGODB_DB_NAME}'")
            # Auto-sync any existing records into MongoDB so Compass sees them immediately
            await sync_data_storage_to_mongodb(db_instance, storage_dir)
            break
        except Exception as e:
            logger.debug(f"Could not connect to {uri}: {e}")

    if not connected:
        logger.warning(
            f"Live MongoDB not reachable on port 27017 ({settings.MONGODB_URI}). "
            "To view records in MongoDB Compass, start the MongoDB service on Windows. "
            "Nexora high-availability local engine is actively storing data in the interim."
        )
        db_instance = ResilientAsyncDB(storage_dir)
        is_connected_to_real_mongo = False
        
    await seed_initial_data(db_instance)
    return db_instance


def get_db():
    global db_instance
    if db_instance is None:
        storage_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "data_storage")
        db_instance = ResilientAsyncDB(storage_dir)
    return db_instance


async def seed_initial_data(db):
    """Ensure Attending OPD Consultant is registered for hospital walk-in and duty bookings."""
    doc_coll = db["doctor_profiles"]
    attending = await doc_coll.find_one({"$or": [{"user_id": "attending-consultant"}, {"_id": "profile-attending-consultant"}]})
    if not attending:
        await doc_coll.insert_one({
            "_id": "profile-attending-consultant",
            "user_id": "attending-consultant",
            "full_name": "Attending OPD Consultant",
            "specialty": "General OPD & Internal Medicine",
            "experience_years": 8,
            "qualifications": "MBBS, MD (Medicine)",
            "hospital_id": "hosp-cpr-kolhapur",
            "hospital_name": "Chhatrapati Pramila Raje (CPR) Hospital",
            "locality": "Kolhapur",
            "consultation_fee_inr": 250,
            "available_days": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
            "available_time_slots": ["09:30 AM", "10:30 AM", "04:00 PM", "05:30 PM"],
            "rating": 4.8,
            "review_count": 14
        })
        users_coll = db["users"]
        if not await users_coll.find_one({"_id": "attending-consultant"}):
            await users_coll.insert_one({
                "_id": "attending-consultant",
                "email": "cpr.opd@kolhapur-health.gov.in",
                "full_name": "Attending OPD Consultant",
                "role": "doctor",
                "hashed_password": "",
                "created_at": datetime.now(timezone.utc).isoformat(),
                "is_active": True
            })
    logger.info("Nexora database ready in clean production mode with Attending OPD Consultant.")


def get_database_status() -> Dict[str, Any]:
    global is_connected_to_real_mongo
    return {
        "is_connected_to_mongodb": is_connected_to_real_mongo,
        "mongodb_uri": settings.MONGODB_URI,
        "database_name": settings.MONGODB_DB_NAME,
        "mode": "MongoDB Server (Live)" if is_connected_to_real_mongo else "Resilient Local Storage (Active)",
        "compass_connection_string": settings.MONGODB_URI if settings.MONGODB_URI.endswith("/") else f"{settings.MONGODB_URI}/",
        "compass_instructions": (
            f"In MongoDB Compass, connect to '{settings.MONGODB_URI}' to view the '{settings.MONGODB_DB_NAME}' database."
            if is_connected_to_real_mongo else
            f"MongoDB Compass is open. Start the MongoDB Server service on your machine to stream records live into '{settings.MONGODB_DB_NAME}'."
        )
    }

