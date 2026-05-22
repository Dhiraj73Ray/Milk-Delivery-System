from fastapi import APIRouter, Depends, HTTPException
from schemas import DeliveryPartnerCreate, DeliveryPartnerUpdate, DeliveryPartner
from database import get_db
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from models import DeliveryPartners
from sqlalchemy import text
from auth.auth_utils import require_admin


router = APIRouter()

@router.post("/delivery-partners", response_model = DeliveryPartner)
def create_partner(partner: DeliveryPartnerCreate, db: Session = Depends(get_db),current_user: dict = Depends(require_admin)):
    new_partner = DeliveryPartners(
        name = partner.name,
        phone = partner.phone,
        area = partner.area
    )
    try:
        db.add(new_partner)
        db.commit()
        db.refresh(new_partner)
        return new_partner
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Phone number already exists")
    
        
    
@router.get("/delivery-partners", response_model = list[DeliveryPartner])
def get_all_partners(db: Session = Depends(get_db),current_user: dict = Depends(require_admin)):
    try:
        partners = db.query(DeliveryPartners).all()
        return partners
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="error: "+str(e))
    
@router.get("/delivery-partners/{partners_id}", response_model = DeliveryPartner)
def get_partners_id(partners_id: int, db: Session = Depends(get_db),current_user: dict = Depends(require_admin)):
    try:
        partners = db.query(DeliveryPartners).filter(DeliveryPartners.id == partners_id).first()
        if partners is None:
            raise HTTPException(status_code=404, detail="Partner not found")
        return partners
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="error: "+str(e))
    

@router.patch("/delivery-partners/{partners_id}", response_model = DeliveryPartner)
def update_partner(partner: DeliveryPartnerUpdate, partners_id: int, db: Session = Depends(get_db),current_user: dict = Depends(require_admin)):
    try:
        partners = db.query(DeliveryPartners).filter(DeliveryPartners.id == partners_id).first()
        if partners is None:
            raise HTTPException(status_code=404, detail="Partner not found")
        if partner.name is not None:
            partners.name = partner.name
        if partner.phone is not None:
            partners.phone = partner.phone
        if partner.area is not None:
            partners.area = partner.area
        db.commit()
        db.refresh(partners)
        return partners
    except HTTPException:
        raise
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Phone number already exists")
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="error: "+str(e))
    

@router.delete("/delivery-partners/{partner_id}", response_model = DeliveryPartner)
def delete_partner_id(partner_id: int, db: Session = Depends(get_db),current_user: dict = Depends(require_admin)):
    try:
        partner = db.query(DeliveryPartners).filter(DeliveryPartners.id == partner_id).first()
        if partner is None:
            raise HTTPException(status_code=404, detail="Partner not found")
        db.delete(partner)
        db.commit()
        return (f"partner {partner.name} with id {partner.id} successfully deleted.")
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="error: "+str(e))
    

@router.delete("/delivery-partners")
def delete_all_partners(db: Session = Depends(get_db),current_user: dict = Depends(require_admin)):
    try:
        db.query(DeliveryPartners).delete()
        db.commit()
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="error: "+str(e))

@router.delete("/delivery-partners/reset/all")
def reset_partners(db: Session = Depends(get_db),current_user: dict = Depends(require_admin)):
    try:
        db.execute(text("TRUNCATE TABLE delivery_partners RESTART IDENTITY"))
        db.commit()
        return {"message": "Table reset successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))