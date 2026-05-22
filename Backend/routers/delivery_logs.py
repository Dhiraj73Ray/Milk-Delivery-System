from fastapi import APIRouter, Depends, HTTPException
from schemas import DeliveryLogsCreate, DeliveryLog, DeliveryLogsUpdate, BulkUpdateLogsPartner
from database import get_db
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from models import DeliveryLogs
from sqlalchemy import text
from auth.auth_utils import require_admin, require_any


router = APIRouter()

@router.post("/logs", response_model=DeliveryLog)
def create_logs(logs: DeliveryLogsCreate, db: Session = Depends(get_db), current_user: dict = Depends(require_any)):

    if current_user["role"] == "delivery_partner":
        if logs.delivery_partner_id != current_user["delivery_partner_id"]:
            raise HTTPException(status_code=403, detail="You can only log deliveries for yourself")
            
    if logs.quantity_delivered <= 0:
        raise HTTPException(status_code=400, detail="Quantity must be greater than 0")
    
    if logs.delivery_status == "done" and logs.quantity_delivered <= 0:
        raise HTTPException(status_code=400, detail="Completed deliveries must have quantity greater than 0")
    
    # 1. Initialize the base model data
    model_data = {
        "delivery_partner_id": logs.delivery_partner_id,
        "customer_id": logs.customer_id,
        "delivery_status": logs.delivery_status,
        "quantity_delivered": logs.quantity_delivered,
    }

    # 2. Check if optional historical date/time were sent from the frontend
    if logs.delivery_date is not None:
        model_data["delivery_date"] = logs.delivery_date
        
    if logs.delivery_time is not None:
        model_data["delivery_time"] = logs.delivery_time

    # 3. Unpack the dictionary into your SQLAlchemy model
    new_logs = DeliveryLogs(**model_data)
    
    try:
        db.add(new_logs)
        db.commit()
        db.refresh(new_logs)
        return new_logs
    except IntegrityError as e:
        db.rollback()
        error = str(e.orig)
        if "delivery_partner_id" in error or "customer_id" in error:
            if "foreign" in error.lower():
                raise HTTPException(status_code=400, detail="Delivery partner or customer not found")
        if "unique" in error.lower():
            raise HTTPException(status_code=400, detail="Log already exists for this customer today")
        raise HTTPException(status_code=400, detail="Database error: " + error)
    

@router.post("/logs/bulk-update-partner")
def bulk_update_logs_partner(
    request: BulkUpdateLogsPartner,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin)  # Only admin can transfer
):
    """
    Bulk update delivery_partner_id in delivery_logs for transferred customers.
    Call this AFTER updating the customer's delivery_partner_id in master_customers.
    
    This ensures all historical logs reflect the new partner assignment.
    """
    
    if not request.customer_ids:
        raise HTTPException(status_code=400, detail="No customer IDs provided")
    
    # Verify new partner exists
    from models import DeliveryPartners
    partner_exists = db.query(DeliveryPartners).filter(
        DeliveryPartners.id == request.new_partner_id
    ).first()
    
    if not partner_exists:
        raise HTTPException(status_code=404, detail=f"Partner with id {request.new_partner_id} not found")
    
    # Update all logs for these customers
    updated_count = db.query(DeliveryLogs).filter(
        DeliveryLogs.customer_id.in_(request.customer_ids)
    ).update(
        {"delivery_partner_id": request.new_partner_id},
        synchronize_session=False
    )
    
    db.commit()
    
    return {
        "message": f"Successfully updated {updated_count} delivery logs",
        "customer_ids": request.customer_ids,
        "new_partner_id": request.new_partner_id,
        "logs_updated": updated_count
    }

@router.get("/logs", response_model=list[DeliveryLog])
def get_all_logs(db: Session = Depends(get_db), current_user: dict = Depends(require_admin)):
    try:
        log = db.query(DeliveryLogs).all()
        return log
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="error: "+ str(e))
    

@router.get("/logs/customer/{customer_id}", response_model=list[DeliveryLog])
def get_customer_logs(customer_id: int, db: Session = Depends(get_db),current_user: dict = Depends(require_admin)):
    try:
        log = db.query(DeliveryLogs).filter(DeliveryLogs.customer_id == customer_id).all()
        if log is None:
            raise HTTPException(status_code=404, detail="Customer not found")
        return log
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="error: "+str(e))
    
@router.get("/logs/partner/{partner_id}", response_model=list[DeliveryLog])
def get_partner_logs(partner_id: int, db: Session = Depends(get_db),current_user: dict = Depends(require_admin)):
    try:
        log = db.query(DeliveryLogs).filter(DeliveryLogs.delivery_partner_id == partner_id).all()
        if log is None:
            raise HTTPException(status_code=404, detail="Partner not found")
        return log
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="error: "+str(e))
    

@router.patch("/logs/{log_id}", response_model=DeliveryLog)
def update_logs(log_id: int, log: DeliveryLogsUpdate, db: Session = Depends(get_db), current_user: dict = Depends(require_any)):
    try:
        db_logs = db.query(DeliveryLogs).filter(DeliveryLogs.id == log_id).first()

        if current_user["role"] == "delivery_partner":
            if db_logs.delivery_partner_id != current_user["delivery_partner_id"]:
                raise HTTPException(status_code=403, detail="You can only log deliveries for yourself")
        
        if db_logs is None:
            raise HTTPException(status_code=404, detail="log not found")
        
        # Validate quantity if being updated
        if log.quantity_delivered is not None:
            if log.quantity_delivered <= 0:
                raise HTTPException(status_code=400, detail="Quantity must be greater than 0")
            db_logs.quantity_delivered = log.quantity_delivered
        
        if log.delivery_status is not None:
            # Additional validation: if status is 'done', ensure quantity > 0
            if log.delivery_status == "done":
                current_qty = log.quantity_delivered if log.quantity_delivered is not None else db_logs.quantity_delivered
                if current_qty <= 0:
                    raise HTTPException(status_code=400, detail="Completed deliveries must have quantity greater than 0")
            db_logs.delivery_status = log.delivery_status
            
        if log.delivery_date is not None:
            db_logs.delivery_date = log.delivery_date
        if log.delivery_time is not None:
            db_logs.delivery_time = log.delivery_time
            
        db.commit()
        db.refresh(db_logs)
        return db_logs
    except HTTPException:
        raise
    except IntegrityError as e:
        db.rollback()
        error = str(e.orig)
        if "delivery_partner_id" in error or "customer_id" in error:
            if "foreign" in error.lower():
                raise HTTPException(status_code=400, detail="Delivery partner or customer not found")
        if "unique" in error.lower():
            raise HTTPException(status_code=400, detail="Log already exists for this customer today")
        raise HTTPException(status_code=400, detail="Database error: " + error)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="error: "+str(e))


@router.delete("/logs/reset/all")
def reset_logs(db: Session = Depends(get_db),current_user: dict = Depends(require_admin)):
    try:
        db.execute(text("TRUNCATE TABLE delivery_logs RESTART IDENTITY"))
        db.commit()
        return {"message": "Table reset successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    
@router.delete("/logs/{log_id}")
def delete_log_id(log_id: int, db: Session = Depends(get_db),current_user: dict = Depends(require_admin)):
    try:
        db_log = db.query(DeliveryLogs).filter(DeliveryLogs.id == log_id).first()
        if db_log is None:
            raise HTTPException(status_code=404, detail="log not found")
        db.delete(db_log)
        db.commit()
        return (f"log with id {db_log.id}, successfully deleted.")
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="error: "+str(e))
    

@router.delete("/logs")
def delete_all_logs(db: Session = Depends(get_db),current_user: dict = Depends(require_admin)):
    try:
        db.query(DeliveryLogs).delete()
        db.commit()
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="error: "+str(e))

