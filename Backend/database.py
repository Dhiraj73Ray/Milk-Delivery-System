from sqlalchemy import create_engine
import os
from dotenv import load_dotenv
from sqlalchemy.orm import sessionmaker
from sqlalchemy.orm import declarative_base

load_dotenv()

Base = declarative_base()

DATABASE_URL = os.getenv("DATABASE_URL")

# --- Strict Production URL Formatting ---
if DATABASE_URL:
    # 1. Force the correct scheme dialect
    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
    
    # 2. Explicitly inject psycopg2 if not defined in the string
    if DATABASE_URL.startswith("postgresql://") and not DATABASE_URL.startswith("postgresql+psycopg2://"):
        DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+psycopg2://", 1)

# 3. Handle SSL for Cloud Databases (Neon)
connect_args = {}
if DATABASE_URL and "localhost" not in DATABASE_URL:
    connect_args = {
        "sslmode": "require"
    }

# Create engine with custom production config
# connection = create_engine(DATABASE_URL, connect_args=connect_args)
# The fix: Add pool_pre_ping and pool_recycle parameters
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,      # Checks if connection is alive before running a query
    pool_recycle=300,        # Closes and recreates connections older than 5 minutes
    pool_size=5,             # Restricts pool sizes on free tier environments
    max_overflow=10
)

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()