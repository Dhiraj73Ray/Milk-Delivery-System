from fastapi import APIRouter, Depends, HTTPException
from schemas import MasterCustomerCreate, MasterCustomerUpdate, MasterCustomer
from database import get_db
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from models import MasterCustomers, MilkRates
from sqlalchemy import text
from auth.auth_utils import require_admin, require_delivery_partner



router = APIRouter()

@router.post("/customers", response_model = MasterCustomer)
def create_customer(customer: MasterCustomerCreate, db: Session = Depends(get_db),current_user: dict = Depends(require_admin)):
    if customer.rate is not None:
        myrate = customer.rate
    else:
        milk_rate = db.query(MilkRates).filter(MilkRates.milk_type == customer.milk_type).first()
        if milk_rate is None:
            raise HTTPException(status_code=400, detail="No default rate found for this milk type. Please provide rate manually.")
        myrate = milk_rate.rate
    new_customer = MasterCustomers(
        name = customer.name,
        phone = customer.phone,
        address = customer.address,
        milk_type = customer.milk_type,
        rate = myrate,
        delivery_partner_id = customer.delivery_partner_id,
        previous_balance = customer.previous_balance
    )
    try:
        db.add(new_customer)
        db.commit()
        db.refresh(new_customer)
        return new_customer
    except IntegrityError as e:
        db.rollback()
        error = str(e.orig)
        if "phone" in error:
            raise HTTPException(status_code=400, detail="Phone number already exists")
        elif "delivery_partner_id" in error or "foreign key" in error.lower():
            raise HTTPException(status_code=400, detail="Delivery partner not found")
        else:
            raise HTTPException(status_code=400, detail="Database integrity error: " + error)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="error: "+str(e))
    

@router.get("/customers", response_model = list[MasterCustomer])
def get_all_customers(db: Session = Depends(get_db),current_user: dict = Depends(require_admin)):
    try:
        customers = db.query(MasterCustomers).all()
        return customers
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="error: "+str(e))
    

@router.get("/customers/by-partner/{partner_id}", response_model = list[MasterCustomer])
def get_customers_by_partner(
    partner_id: int, 
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin)
):
    try:
        customers = db.query(MasterCustomers).filter(
            MasterCustomers.delivery_partner_id == partner_id,
            MasterCustomers.status != "deleted"
        ).all()
        return customers
    except Exception as e:
        raise HTTPException(status_code=500, detail="error: "+str(e))
    

@router.get("/customers/{customer_id}", response_model=MasterCustomer)
def get_customer(customer_id: int, db: Session = Depends(get_db),current_user: dict = Depends(require_admin)):
    try:
        customer = db.query(MasterCustomers).filter(MasterCustomers.id == customer_id).first()
        if customer is None:
            raise HTTPException(status_code=404, detail="Customer not found")
        return customer
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="error: " + str(e))


@router.patch("/customers/{customer_id}", response_model=MasterCustomer)
def update_customer(customer_id: int, customer: MasterCustomerUpdate, db: Session = Depends(get_db),current_user: dict = Depends(require_admin)):
    try:
        db_customer = db.query(MasterCustomers).filter(MasterCustomers.id == customer_id).first()
        if db_customer is None:
            raise HTTPException(status_code=404, detail="Customer not found")
        if customer.name is not None:
            db_customer.name = customer.name
        if customer.phone is not None:
            db_customer.phone = customer.phone
        if customer.address is not None:
            db_customer.address = customer.address
        if customer.milk_type is not None:
            db_customer.milk_type = customer.milk_type
        if customer.rate is not None:
            db_customer.rate = customer.rate
        if customer.delivery_partner_id is not None:
            db_customer.delivery_partner_id = customer.delivery_partner_id
        if customer.previous_balance is not None:
            db_customer.previous_balance = customer.previous_balance
        if customer.status is not None:
            db_customer.status = customer.status
        db.commit()
        db.refresh(db_customer)
        return db_customer
    except HTTPException:
        raise
    except IntegrityError as e:
        db.rollback()
        error = str(e.orig)
        if "phone" in error:
            raise HTTPException(status_code=400, detail="Phone number already exists")
        elif "delivery_partner_id" in error or "foreign key" in error.lower():
            raise HTTPException(status_code=400, detail="Delivery partner not found")
        else:
            raise HTTPException(status_code=400, detail="Integrity error: " + error)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="error: " + str(e))


@router.delete("/customers/{customer_id}")
def delete_customer(customer_id: int, db: Session = Depends(get_db),current_user: dict = Depends(require_admin)):
    try:
        customer = db.query(MasterCustomers).filter(MasterCustomers.id == customer_id).first()
        if customer is None:
            raise HTTPException(status_code=404, detail="Customer not found")
        customer.status = "deleted"
        db.commit()
        return {"message": f"Customer {customer.name} with id {customer.id} marked as deleted"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="error: " + str(e))

@router.delete("/customers")
def delete_all_customers(db: Session = Depends(get_db),current_user: dict = Depends(require_admin)):
    try:
        db.query(MasterCustomers).delete()
        db.commit()
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="error: "+str(e))

@router.delete("/Customers/reset/all")
def reset_Customers(db: Session = Depends(get_db),current_user: dict = Depends(require_admin)):
    try:
        db.execute(text("TRUNCATE TABLE master_customers RESTART IDENTITY"))
        db.commit()
        return {"message": "Table reset successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    
@router.get("/customers/my/list")
def get_my_customers(
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_delivery_partner)
):
    customers = db.query(MasterCustomers).filter(
        MasterCustomers.delivery_partner_id == current_user["delivery_partner_id"],
        MasterCustomers.status == "active"
    ).all()
    return customers