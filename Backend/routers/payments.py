from fastapi import APIRouter, Depends, HTTPException
from schemas import PaymentCreate, Payment, PaymentUpdate
from database import get_db
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from models import Payments
from sqlalchemy import text
from auth.auth_utils import require_admin

router = APIRouter()

@router.post("/payments", response_model=Payment)
def create_payment(payment: PaymentCreate, db: Session = Depends(get_db),current_user: dict = Depends(require_admin)):
    new_payment = Payments(
        customer_id=payment.customer_id,
        amount=payment.amount,
        payment_mode=payment.payment_mode,
        for_month=payment.for_month,
    )
    try:
        db.add(new_payment)
        db.commit()
        db.refresh(new_payment)
        return new_payment
    except IntegrityError as e:
        db.rollback()
        error = str(e.orig)
        if "foreign" in error.lower():
            raise HTTPException(status_code=400, detail="Customer not found")
        raise HTTPException(status_code=400, detail="Database error: " + error)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="error: " + str(e))


@router.get("/payments", response_model=list[Payment])
def get_all_payments(db: Session = Depends(get_db),current_user: dict = Depends(require_admin)):
    try:
        payments = db.query(Payments).all()
        return payments
    except Exception as e:
        raise HTTPException(status_code=500, detail="error: " + str(e))


@router.get("/payments/customer/{customer_id}", response_model=list[Payment])
def get_customer_payments(customer_id: int, db: Session = Depends(get_db),current_user: dict = Depends(require_admin)):
    try:
        payments = db.query(Payments).filter(Payments.customer_id == customer_id).all()
        if not payments:
            raise HTTPException(status_code=404, detail="No payments found for this customer")
        return payments
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="error: " + str(e))


@router.get("/payments/customer/{customer_id}/month/{for_month}", response_model=list[Payment])
def get_customer_payments_by_month(customer_id: int, for_month: str, db: Session = Depends(get_db),current_user: dict = Depends(require_admin)):
    try:
        payments = db.query(Payments).filter(
            Payments.customer_id == customer_id,
            Payments.for_month == for_month
        ).all()
        if not payments:
            raise HTTPException(status_code=404, detail="No payments found for this customer and month")
        return payments
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="error: " + str(e))


@router.patch("/payments/{payment_id}", response_model=Payment)
def update_payment(payment_id: int, payment: PaymentUpdate, db: Session = Depends(get_db),current_user: dict = Depends(require_admin)):
    try:
        db_payment = db.query(Payments).filter(Payments.id == payment_id).first()
        if db_payment is None:
            raise HTTPException(status_code=404, detail="Payment not found")
        if payment.customer_id is not None:
            db_payment.customer_id = payment.customer_id
        if payment.amount is not None:
            db_payment.amount = payment.amount
        if payment.payment_mode is not None:
            db_payment.payment_mode = payment.payment_mode
        if payment.for_month is not None:
            db_payment.for_month = payment.for_month
        if payment.payment_date is not None:
            db_payment.payment_date = payment.payment_date
        db.commit()
        db.refresh(db_payment)
        return db_payment
    except HTTPException:
        raise
    except IntegrityError as e:
        db.rollback()
        error = str(e.orig)
        if "foreign" in error.lower():
            raise HTTPException(status_code=400, detail="Customer not found")
        raise HTTPException(status_code=400, detail="Database error: " + error)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="error: " + str(e))


@router.delete("/payments/reset/all")
def reset_payments(db: Session = Depends(get_db),current_user: dict = Depends(require_admin)):
    try:
        db.execute(text("TRUNCATE TABLE payments RESTART IDENTITY"))
        db.commit()
        return {"message": "Payments table reset successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/payments/{payment_id}")
def delete_payment(payment_id: int, db: Session = Depends(get_db), current_user: dict = Depends(require_admin)):
    try:
        db_payment = db.query(Payments).filter(Payments.id == payment_id).first()
        if db_payment is None:
            raise HTTPException(status_code=404, detail="Payment not found")
        db.delete(db_payment)
        db.commit()
        return {"message": f"Payment with id {db_payment.id} deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="error: " + str(e))