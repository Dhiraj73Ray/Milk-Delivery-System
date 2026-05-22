from fastapi import APIRouter, Depends, HTTPException
from database import get_db
from sqlalchemy.orm import Session
from sqlalchemy import func
from models import MasterCustomers, DeliveryLogs, Payments, DeliveryPartners
from datetime import datetime, date
from auth.auth_utils import require_admin, require_any
router = APIRouter()


# 1. Full day report — all partners, all deliveries for a date
@router.get("/dsr/date/{date}")
def get_dsr_by_date(date: str, db: Session = Depends(get_db), current_user: dict = Depends(require_admin)):
    try:
        logs = db.query(
            DeliveryLogs,
            MasterCustomers.name.label("customer_name"),
            DeliveryPartners.name.label("partner_name")
        ).join(
            MasterCustomers, DeliveryLogs.customer_id == MasterCustomers.id
        ).join(
            DeliveryPartners, DeliveryLogs.delivery_partner_id == DeliveryPartners.id
        ).filter(
            func.to_char(DeliveryLogs.delivery_date, "YYYY-MM-DD") == date
        ).all()

        if not logs:
            raise HTTPException(status_code=404, detail="No deliveries found for this date")

        result = []
        for log, customer_name, partner_name in logs:
            result.append({
                "log_id": log.id,
                "date": log.delivery_date,
                "partner_name": partner_name,
                "customer_name": customer_name,
                "quantity_delivered": log.quantity_delivered,
                "delivery_status": log.delivery_status,
            })

        total_litres = sum(r["quantity_delivered"] for r in result)
        total_deliveries = len(result)
        done = sum(1 for r in result if r["delivery_status"] == "done")
        pending = sum(1 for r in result if r["delivery_status"] == "pending")
        cancelled = sum(1 for r in result if r["delivery_status"] == "cancelled")

        return {
            "date": date,
            "total_deliveries": total_deliveries,
            "total_litres": total_litres,
            "done": done,
            "pending": pending,
            "cancelled": cancelled,
            "logs": result
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="error: " + str(e))


# 2. One partner's report for a specific date
@router.get("/dsr/partner/{partner_id}/date/{date}")
def get_partner_dsr_by_date(
    partner_id: int, 
    date: str, 
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_any)
):
    """
    Get DSR for a specific partner on a specific date
    Returns RICH data similar to admin DSR endpoint
    """
    
    # Query with all necessary fields
    results = db.query(
        DeliveryLogs.id.label('log_id'),
        MasterCustomers.id.label('customer_id'),
        MasterCustomers.name.label('customer_name'),
        DeliveryLogs.quantity_delivered,
        DeliveryLogs.delivery_status,
        DeliveryLogs.delivery_time,
        DeliveryLogs.delivery_date,
    ).join(
        MasterCustomers, DeliveryLogs.customer_id == MasterCustomers.id
    ).filter(
        DeliveryLogs.delivery_partner_id == partner_id,
        DeliveryLogs.delivery_date == date
    ).all()
    
    # Get partner name
    partner = db.query(DeliveryPartners).filter(DeliveryPartners.id == partner_id).first()
    partner_name = partner.name if partner else "Unknown"
    
    # Format logs with all needed fields
    logs = []
    for row in results:
        logs.append({
            "log_id": row.log_id,
            "customer_id": row.customer_id,
            "customer_name": row.customer_name,
            "quantity_delivered": row.quantity_delivered,
            "delivery_status": row.delivery_status,
            "delivery_time_raw": str(row.delivery_time) if row.delivery_time else None,
            "delivery_date": str(row.delivery_date) if row.delivery_date else None,
        })
    
    total_litres = sum(log['quantity_delivered'] for log in logs)
    
    return {
        "partner_name": partner_name,
        "date": date,
        "total_customers": len(logs),
        "total_litres": total_litres,
        "logs": logs
    }


# 3. Monthly summary per partner
@router.get("/dsr/partner/{partner_id}/month/{month}")
def get_dsr_partner_monthly(partner_id: int, month: str, db: Session = Depends(get_db), current_user: dict = Depends(require_any)):
    try:
        partner = db.query(DeliveryPartners).filter(DeliveryPartners.id == partner_id).first()
        if partner is None:
            raise HTTPException(status_code=404, detail="Partner not found")

        total_litres = db.query(func.sum(DeliveryLogs.quantity_delivered)).filter(
            DeliveryLogs.delivery_partner_id == partner_id,
            func.to_char(DeliveryLogs.delivery_date, "YYYY-MM") == month
        ).scalar() or 0.0

        total_deliveries = db.query(func.count(DeliveryLogs.id)).filter(
            DeliveryLogs.delivery_partner_id == partner_id,
            func.to_char(DeliveryLogs.delivery_date, "YYYY-MM") == month
        ).scalar() or 0

        done = db.query(func.count(DeliveryLogs.id)).filter(
            DeliveryLogs.delivery_partner_id == partner_id,
            func.to_char(DeliveryLogs.delivery_date, "YYYY-MM") == month,
            DeliveryLogs.delivery_status == "done"
        ).scalar() or 0

        cancelled = db.query(func.count(DeliveryLogs.id)).filter(
            DeliveryLogs.delivery_partner_id == partner_id,
            func.to_char(DeliveryLogs.delivery_date, "YYYY-MM") == month,
            DeliveryLogs.delivery_status == "cancelled"
        ).scalar() or 0

        return {
            "partner_name": partner.name,
            "month": month,
            "total_deliveries": total_deliveries,
            "total_litres": total_litres,
            "done": done,
            "cancelled": cancelled,
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="error: " + str(e))


# 4. Monthly summary for all partners
@router.get("/dsr/month/{month}")
def get_dsr_monthly_all(month: str, db: Session = Depends(get_db), current_user: dict = Depends(require_admin)):
    try:
        partners = db.query(DeliveryPartners).all()
        result = []

        for partner in partners:
            total_litres = db.query(func.sum(DeliveryLogs.quantity_delivered)).filter(
                DeliveryLogs.delivery_partner_id == partner.id,
                func.to_char(DeliveryLogs.delivery_date, "YYYY-MM") == month
            ).scalar() or 0.0

            total_deliveries = db.query(func.count(DeliveryLogs.id)).filter(
                DeliveryLogs.delivery_partner_id == partner.id,
                func.to_char(DeliveryLogs.delivery_date, "YYYY-MM") == month
            ).scalar() or 0

            result.append({
                "partner_name": partner.name,
                "total_deliveries": total_deliveries,
                "total_litres": total_litres,
            })

        grand_total_litres = sum(r["total_litres"] for r in result)

        return {
            "month": month,
            "grand_total_litres": grand_total_litres,
            "partners": result
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="error: " + str(e))


# 5. Customer delivery history for a month
@router.get("/dsr/customer/{customer_id}/month/{month}")
def get_dsr_customer_monthly(customer_id: int, month: str, db: Session = Depends(get_db), current_user: dict = Depends(require_admin)):
    try:
        customer = db.query(MasterCustomers).filter(MasterCustomers.id == customer_id).first()
        if customer is None:
            raise HTTPException(status_code=404, detail="Customer not found")

        logs = db.query(DeliveryLogs).filter(
            DeliveryLogs.customer_id == customer_id,
            func.to_char(DeliveryLogs.delivery_date, "YYYY-MM") == month
        ).all()

        result = []
        for log in logs:
            result.append({
                "date": log.delivery_date,
                "quantity_delivered": log.quantity_delivered,
                "delivery_status": log.delivery_status,
            })

        total_litres = sum(r["quantity_delivered"] for r in result)

        return {
            "customer_name": customer.name,
            "month": month,
            "total_days_delivered": len(result),
            "total_litres": total_litres,
            "logs": result
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="error: " + str(e))


@router.get("/dsr/month/{month}/structured")
def get_dsr_month_structured(month: str, db: Session = Depends(get_db), current_user: dict = Depends(require_admin)):
    try:
        partners = db.query(DeliveryPartners).all()

        # get all days in month
        year, mon = int(month.split("-")[0]), int(month.split("-")[1])
        if mon == 12:
            next_month = date(year + 1, 1, 1)
        else:
            next_month = date(year, mon + 1, 1)
        first_day = date(year, mon, 1)
        days_in_month = (next_month - first_day).days

        result = []

        for partner in partners:
            # get all customers assigned to this partner
            customers = db.query(MasterCustomers).filter(
                MasterCustomers.delivery_partner_id == partner.id,
                MasterCustomers.status == "active"
            ).all()

            if not customers:
                continue

            # get all logs for this partner this month
            logs = db.query(DeliveryLogs).filter(
                DeliveryLogs.delivery_partner_id == partner.id,
                func.to_char(DeliveryLogs.delivery_date, "YYYY-MM") == month
            ).all()

            # build lookup: {customer_id: {day: log}}
            log_lookup = {}
            for log in logs:
                cid = log.customer_id
                day = log.delivery_date.day
                if cid not in log_lookup:
                    log_lookup[cid] = {}
                log_lookup[cid][day] = log

            # build days structure
            days = {}
            for day in range(1, days_in_month + 1):
                day_key = f"day-{day:02d}"
                day_data = []

                for customer in customers:
                    customer_key = f"{customer.name}, {customer.address}"
                    log = log_lookup.get(customer.id, {}).get(day)

                    if log is None:
                        day_data.append({
                            customer_key: {
                                "delivery_status": "not logged"
                            },
                            "log_id": None,  # No log exists
                            "delivery_partner_id": partner.id,
                            "customer_id": customer.id
                        })
                    else:
                        # Get the log ID from the actual log object
                        current_log_id = log.id
                        
                        if log.delivery_status == "done":
                            day_data.append({
                                customer_key: {
                                    "delivery_status": log.delivery_status,
                                    "delivery_time": str(log.delivery_time) if log.delivery_time else None,
                                    "liters": log.quantity_delivered
                                },
                                "log_id": current_log_id,
                                "delivery_partner_id": log.delivery_partner_id,
                                "customer_id": customer.id
                            })
                        else:
                            day_data.append({
                                customer_key: {
                                    "delivery_status": log.delivery_status
                                },
                                "log_id": current_log_id,
                                "delivery_partner_id": log.delivery_partner_id,
                                "customer_id": customer.id
                            })

                days[day_key] = day_data

            result.append({
                "partner_name": partner.name,
                "area": partner.area,
                **days
            })

        return result

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="error: " + str(e))