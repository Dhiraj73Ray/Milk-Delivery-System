from sqlalchemy import create_engine
import os
from dotenv import load_dotenv
from sqlalchemy.orm import sessionmaker
# from sqlalchemy.ext.declarative import declarative_base  ## "older version of sqlalchemy, newer versions use from sqlalchemy.orm import declarative_base"
from sqlalchemy.orm import declarative_base

load_dotenv()

Base = declarative_base()


DATABASE_URL = os.getenv("DATABASE_URL")

connection = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(bind=connection, autoflush=False, autocommit=False)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()