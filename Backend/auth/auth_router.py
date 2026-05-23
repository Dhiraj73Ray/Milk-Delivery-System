from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database import get_db
from models import Users
from auth.auth_utils import verify_password, hash_password, create_access_token, require_admin, require_any
import os
from dotenv import load_dotenv

load_dotenv()

router = APIRouter(prefix="/auth", tags=["Auth"])


class LoginRequest(BaseModel):
    phone: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    role: str
    user_id: int
    delivery_partner_id: int | None


class CreateUserRequest(BaseModel):
    name: str
    phone: str
    password: str
    role: str = "delivery_partner"
    delivery_partner_id: int | None = None


class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str


class UpdateUserRequest(BaseModel):
    name: str | None = None
    phone: str | None = None
    role: str | None = None
    delivery_partner_id: int | None = None
    password: str | None = None

# --- Login ---
@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(Users).filter(Users.phone == payload.phone).first()

    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token({
        "sub": user.phone,
        "role": user.role,
        "user_id": user.id,
        "delivery_partner_id": user.delivery_partner_id
    })

    return {
        "access_token": token,
        "token_type": "bearer",
        "role": user.role,
        "user_id": user.id,
        "delivery_partner_id": user.delivery_partner_id
    }


# --- Create User (admin only) ---
@router.post("/users")
def create_user(
    payload: CreateUserRequest,
    db: Session = Depends(get_db)
    # current_user: dict = Depends(require_admin)
):
    exists = db.query(Users).filter(Users.phone == payload.phone).first()
    if exists:
        raise HTTPException(status_code=400, detail="Phone already registered")

    user = Users(
        name=payload.name,
        phone=payload.phone,
        hashed_password=hash_password(payload.password),
        role=payload.role,
        delivery_partner_id=payload.delivery_partner_id
        
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"message": "User created successfully", "user_id": user.id}


# --- Get all users (admin only) ---
@router.get("/users")
def get_all_users(
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin)
):
    users = db.query(Users).all()
    return [
        {
            "id": u.id,
            "name": u.name,
            "phone": u.phone,
            "role": u.role,
            "delivery_partner_id": u.delivery_partner_id
            "created_at": u.created_at.isoformat() if u.created_at else None
        }
        for u in users
    ]


# --- Change password (any logged in user) ---
@router.post("/change-password")
def change_password(
    payload: ChangePasswordRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_any)
):
    user = db.query(Users).filter(Users.id == current_user["user_id"]).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if not verify_password(payload.old_password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Old password is incorrect")

    user.hashed_password = hash_password(payload.new_password)
    db.commit()
    return {"message": "Password changed successfully"}


# --- Delete user (admin only) ---
@router.delete("/users/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin)
):
    user = db.query(Users).filter(Users.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(user)
    db.commit()
    return {"message": "User deleted successfully"}


@router.patch("/users/{user_id}")
def update_user(
    user_id: int,
    payload: UpdateUserRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin)
):
    user = db.query(Users).filter(Users.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if payload.name is not None:
        user.name = payload.name
    if payload.phone is not None:
        user.phone = payload.phone
    if payload.role is not None:
        user.role = payload.role
    if payload.delivery_partner_id is not None:
        user.delivery_partner_id = payload.delivery_partner_id
    if payload.password is not None and payload.password.strip():
        user.hashed_password = hash_password(payload.password)

    db.commit()
    db.refresh(user)
    return {
        "message": "User updated successfully", 
        "user_id": user.id,
        "created_at": user.created_at.isoformat() if user.created_at else None  # ✅ Add this
    }