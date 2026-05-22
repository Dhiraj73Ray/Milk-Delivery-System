from fastapi import APIRouter, Depends, HTTPException
from database import get_db
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from models import MilkRates
from pydantic import BaseModel
from typing import Optional
from auth.auth_utils import require_admin

router = APIRouter()

class MilkRateCreate(BaseModel):
    milk_type: str
    rate: float

class MilkRate(MilkRateCreate):
    class Config:
        from_attributes = True
    id: int
    updated_at: Optional[str] = None

class MilkRateUpdate(BaseModel):
    milk_type: Optional[str] = None
    rate: Optional[float] = None


@router.post("/milk-rates", response_model=MilkRate)
def create_milk_rate(milk_rate: MilkRateCreate, db: Session = Depends(get_db), current_user: dict = Depends(require_admin)):
    new_rate = MilkRates(
        milk_type=milk_rate.milk_type,
        rate=milk_rate.rate
    )
    try:
        db.add(new_rate)
        db.commit()
        db.refresh(new_rate)
        return new_rate
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Milk type already exists")
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="error: " + str(e))


@router.get("/milk-rates", response_model=list[MilkRate])
def get_all_milk_rates(db: Session = Depends(get_db), current_user: dict = Depends(require_admin)):
    try:
        rates = db.query(MilkRates).all()
        return rates
    except Exception as e:
        raise HTTPException(status_code=500, detail="error: " + str(e))


@router.get("/milk-rates/{rate_id}", response_model=MilkRate)
def get_milk_rate(rate_id: int, db: Session = Depends(get_db), current_user: dict = Depends(require_admin)):
    try:
        rate = db.query(MilkRates).filter(MilkRates.id == rate_id).first()
        if rate is None:
            raise HTTPException(status_code=404, detail="Milk rate not found")
        return rate
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="error: " + str(e))


@router.patch("/milk-rates/{rate_id}", response_model=MilkRate)
def update_milk_rate(rate_id: int, milk_rate: MilkRateUpdate, db: Session = Depends(get_db), current_user: dict = Depends(require_admin)):
    try:
        db_rate = db.query(MilkRates).filter(MilkRates.id == rate_id).first()
        if db_rate is None:
            raise HTTPException(status_code=404, detail="Milk rate not found")
        if milk_rate.milk_type is not None:
            db_rate.milk_type = milk_rate.milk_type
        if milk_rate.rate is not None:
            db_rate.rate = milk_rate.rate
        db.commit()
        db.refresh(db_rate)
        return db_rate
    except HTTPException:
        raise
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Milk type already exists")
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="error: " + str(e))


@router.delete("/milk-rates/{rate_id}")
def delete_milk_rate(rate_id: int, db: Session = Depends(get_db), current_user: dict = Depends(require_admin)):
    try:
        db_rate = db.query(MilkRates).filter(MilkRates.id == rate_id).first()
        if db_rate is None:
            raise HTTPException(status_code=404, detail="Milk rate not found")
        db.delete(db_rate)
        db.commit()
        return {"message": f"Milk rate for {db_rate.milk_type} deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="error: " + str(e))