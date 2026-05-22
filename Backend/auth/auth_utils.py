from datetime import datetime, timedelta
from jose import JWTError, jwt
import bcrypt  # <-- Change passlib to native bcrypt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from database import get_db
from models import DeliveryPartners
import os
from dotenv import load_dotenv

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 2  # 2 hours = 120 minutes

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


# --- New Production-Safe Password Helpers (Native Bcrypt) ---
def hash_password(password: str) -> str:
    """
    Hashes a plain text password using native bcrypt.
    """
    password_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed_bytes = bcrypt.hashpw(password_bytes, salt)
    return hashed_bytes.decode('utf-8')


def verify_password(plain: str, hashed: str) -> bool:
    """
    Verifies a plain text password against the stored bcrypt hash string.
    """
    try:
        plain_bytes = plain.encode('utf-8')
        hashed_bytes = hashed.encode('utf-8')
        return bcrypt.checkpw(plain_bytes, hashed_bytes)
    except Exception:
        return False


# --- Token Helper ---
def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    # Note: converted to utcnow() cleanly or left as-is to preserve your existing flow
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode["exp"] = expire
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


# --- get_current_user dependency ---
def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        phone: str = payload.get("sub")
        role: str = payload.get("role")
        user_id: int = payload.get("user_id")
        delivery_partner_id: int = payload.get("delivery_partner_id")
        if phone is None or role is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    return {"phone": phone, "role": role, "user_id": user_id, "delivery_partner_id": delivery_partner_id}


# --- Permission Guards ---
def require_admin(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admins only")
    return current_user

def require_delivery_partner(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "delivery_partner":
        raise HTTPException(status_code=403, detail="Delivery partners only")
    return current_user

def require_any(current_user: dict = Depends(get_current_user)):
    return current_user  # just validates token, any role allowed