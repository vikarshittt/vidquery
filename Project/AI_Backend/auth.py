"""
auth.py — Authentication routes and helpers for VidQuery.
Handles user registration, login, JWT issuance, and chat history persistence.
"""

import os
from datetime import datetime, timedelta, timezone
from typing import Optional

import bcrypt
from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from pydantic import BaseModel, EmailStr
from pymongo import MongoClient
from bson import ObjectId

# ─── Config ──────────────────────────────────────────────────────────────────
MONGO_URI = os.getenv("MONGO_URI", "")
JWT_SECRET = os.getenv("JWT_SECRET", "change_me_in_production")
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_HOURS = 72

# ─── DB ──────────────────────────────────────────────────────────────────────
_client: Optional[MongoClient] = None

def get_db():
    global _client
    if _client is None:
        _client = MongoClient(MONGO_URI)
    return _client["vidquery"]

# ─── Models ──────────────────────────────────────────────────────────────────
class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class SaveHistoryRequest(BaseModel):
    video_id: str
    video_url: str
    title: str          # user-supplied or derived
    messages: list      # list of {role, content}

# ─── JWT helpers ─────────────────────────────────────────────────────────────
def create_token(user_id: str, email: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRE_HOURS)
    payload = {"sub": user_id, "email": email, "exp": expire}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token.")

# ─── Auth dependency ─────────────────────────────────────────────────────────
bearer_scheme = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)) -> dict:
    return decode_token(credentials.credentials)

# ─── Router ──────────────────────────────────────────────────────────────────
router = APIRouter(prefix="/api/auth", tags=["auth"])

@router.post("/register", status_code=201)
def register(req: RegisterRequest):
    db = get_db()
    if db.users.find_one({"email": req.email}):
        raise HTTPException(status_code=409, detail="Email already registered.")

    hashed = bcrypt.hashpw(req.password.encode(), bcrypt.gensalt()).decode()
    result = db.users.insert_one({
        "name": req.name,
        "email": req.email,
        "password": hashed,
        "created_at": datetime.now(timezone.utc),
    })
    token = create_token(str(result.inserted_id), req.email)
    return {"token": token, "name": req.name, "email": req.email}


@router.post("/login")
def login(req: LoginRequest):
    db = get_db()
    user = db.users.find_one({"email": req.email})
    if not user or not bcrypt.checkpw(req.password.encode(), user["password"].encode()):
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    token = create_token(str(user["_id"]), req.email)
    return {"token": token, "name": user["name"], "email": req.email}


@router.get("/me")
def me(current_user: dict = Depends(get_current_user)):
    db = get_db()
    user = db.users.find_one({"_id": ObjectId(current_user["sub"])})
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    return {"name": user["name"], "email": user["email"]}


# ─── History router ──────────────────────────────────────────────────────────
history_router = APIRouter(prefix="/api/history", tags=["history"])

@history_router.post("/save")
def save_history(req: SaveHistoryRequest, current_user: dict = Depends(get_current_user)):
    db = get_db()
    doc = {
        "user_id": current_user["sub"],
        "video_id": req.video_id,
        "video_url": req.video_url,
        "title": req.title,
        "messages": req.messages,
        "saved_at": datetime.now(timezone.utc),
    }
    result = db.history.insert_one(doc)
    return {"id": str(result.inserted_id)}


@history_router.get("/list")
def list_history(current_user: dict = Depends(get_current_user)):
    db = get_db()
    items = list(
        db.history.find({"user_id": current_user["sub"]})
        .sort("saved_at", -1)
        .limit(50)
    )
    for item in items:
        item["_id"] = str(item["_id"])
    return {"history": items}


@history_router.delete("/{history_id}")
def delete_history(history_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    result = db.history.delete_one({
        "_id": ObjectId(history_id),
        "user_id": current_user["sub"],
    })
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="History item not found.")
    return {"message": "Deleted."}
