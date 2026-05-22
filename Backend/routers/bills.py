from fastapi import APIRouter, Depends, HTTPException
from database import get_db
from sqlalchemy.orm import Session
from sqlalchemy import func
from models import MasterCustomers, DeliveryLogs, Payments, DeliveryPartners
from auth.auth_utils import require_admin

router = APIRouter()

def get_previous_months(for_month: str):
    """Get all previous months in the same year"""
    year, month = for_month.split("-")
    prev_months = []
    for m in range(1, int(month)):
        prev_month_str = f"{year}-{str(m).zfill(2)}"
        prev_months.append(prev_month_str)
    return prev_months

def calculate_cumulative_balance(customer_id: int, current_month: str, db: Session):
    """Calculate balance from ALL previous months"""
    prev_months = get_previous_months(current_month)
    cumulative_balance = 0.0
    
    for prev_month in prev_months:
        # Total litres for previous month
        prev_litres = db.query(func.sum(DeliveryLogs.quantity_delivered)).filter(
            DeliveryLogs.customer_id == customer_id,
            func.to_char(DeliveryLogs.delivery_date, "YYYY-MM") == prev_month
        ).scalar() or 0.0
        
        # Get customer rate for that month
        customer = db.query(MasterCustomers).filter(MasterCustomers.id == customer_id).first()
        if customer:
            prev_amount = prev_litres * customer.rate
        else:
            prev_amount = 0.0
        
        # Total paid for previous month
        prev_paid = db.query(func.sum(Payments.amount)).filter(
            Payments.customer_id == customer_id,
            Payments.for_month == prev_month
        ).scalar() or 0.0
        
        # Balance for that month
        prev_balance = prev_amount - prev_paid
        cumulative_balance += prev_balance
    
    return cumulative_balance


@router.get("/bills/customer/{customer_id}/month/{for_month}")
def get_customer_bill(customer_id: int, for_month: str, db: Session = Depends(get_db), current_user: dict = Depends(require_admin)):
    try:
        # 1. Get customer
        customer = db.query(MasterCustomers).filter(MasterCustomers.id == customer_id).first()
        if customer is None:
            raise HTTPException(status_code=404, detail="Customer not found")
        
        # Get partner info
        partner = db.query(DeliveryPartners).filter(DeliveryPartners.id == customer.delivery_partner_id).first()

        # 2. Total litres delivered this month
        total_litres = db.query(func.sum(DeliveryLogs.quantity_delivered)).filter(
            DeliveryLogs.customer_id == customer_id,
            func.to_char(DeliveryLogs.delivery_date, "YYYY-MM") == for_month
        ).scalar() or 0.0

        # 3. Total amount for this month
        total_amount = total_litres * customer.rate

        # 4. Previous balance (cumulative from all previous months)
        previous_balance = calculate_cumulative_balance(customer_id, for_month, db)

        # 5. Grand total
        grand_total = total_amount + previous_balance

        # 6. Total paid this month
        total_paid = db.query(func.sum(Payments.amount)).filter(
            Payments.customer_id == customer_id,
            Payments.for_month == for_month
        ).scalar() or 0.0

        # 7. Remaining balance
        balance = grand_total - total_paid

        return {
            "customer_id": customer_id,
            "customer_name": customer.name,
            "partner_id": partner.id if partner else None,
            "partner_name": partner.name if partner else "No Partner",
            "month": for_month,
            "rate_per_litre": customer.rate,
            "total_litres": total_litres,
            "total_amount": total_amount,
            "previous_balance": round(previous_balance, 2),
            "grand_total": round(grand_total, 2),
            "total_paid": float(total_paid),
            "balance": round(balance, 2)
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="error: " + str(e))


@router.get("/bills/month/{for_month}")
def get_all_bills_for_month(for_month: str, db: Session = Depends(get_db), current_user: dict = Depends(require_admin)):
    try:
        # Get all active customers
        customers = db.query(MasterCustomers).filter(MasterCustomers.status == "active").all()

        bills = []
        for customer in customers:
            # Get partner info
            partner = db.query(DeliveryPartners).filter(DeliveryPartners.id == customer.delivery_partner_id).first()
            
            # Total litres this month
            total_litres = db.query(func.sum(DeliveryLogs.quantity_delivered)).filter(
                DeliveryLogs.customer_id == customer.id,
                func.to_char(DeliveryLogs.delivery_date, "YYYY-MM") == for_month
            ).scalar() or 0.0

            total_amount = total_litres * customer.rate
            
            # Previous balance (cumulative from all previous months)
            previous_balance = calculate_cumulative_balance(customer.id, for_month, db)
            
            grand_total = total_amount + previous_balance

            total_paid = db.query(func.sum(Payments.amount)).filter(
                Payments.customer_id == customer.id,
                Payments.for_month == for_month
            ).scalar() or 0.0

            balance = grand_total - total_paid

            bills.append({
                "customer_id": customer.id,
                "customer_name": customer.name,
                "partner_id": partner.id if partner else None,
                "partner_name": partner.name if partner else "No Partner",
                "month": for_month,
                "rate_per_litre": customer.rate,
                "total_litres": total_litres,
                "total_amount": round(total_amount, 2),
                "previous_balance": round(previous_balance, 2),
                "grand_total": round(grand_total, 2),
                "total_paid": float(total_paid),
                "balance": round(balance, 2)
            })

        return bills

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="error: " + str(e))