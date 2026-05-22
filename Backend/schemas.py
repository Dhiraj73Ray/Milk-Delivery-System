from pydantic import BaseModel
from datetime import datetime, date, time
from typing import Optional
from typing import List

class DeliveryPartnerCreate(BaseModel):
    name: str
    phone: str 
    area: str

class DeliveryPartner(DeliveryPartnerCreate):
    class Config:
        from_attributes = True
    id: int
    created_at: datetime
    updated_at: datetime


class DeliveryPartnerUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    area: Optional[str] = None

class MasterCustomerCreate(BaseModel):
    name: str
    phone: str
    address: str
    milk_type: str
    rate: Optional[float] = None
    delivery_partner_id: Optional[int] = None
    previous_balance: Optional[float] = 0.0


class MasterCustomer(MasterCustomerCreate):
    class Config:
        from_attributes = True
    id: int
    status: str
    created_at: datetime
    updated_at: datetime

class MasterCustomerUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    milk_type: Optional[str] = None
    rate: Optional[float] = None
    delivery_partner_id: Optional[int] = None
    previous_balance: Optional[float] = None
    status: Optional[str] = None

class DeliveryLogsCreate(BaseModel):
    delivery_partner_id: int
    customer_id: int
    delivery_status: str
    quantity_delivered: float
    delivery_date: Optional[date] = None
    delivery_time: Optional[time] = None


class DeliveryLog(DeliveryLogsCreate):
    class Config:
        from_attributes = True
    id: int
    delivery_date: date
    delivery_time: time
    created_at: datetime
    updated_at: datetime


class DeliveryLogsUpdate(BaseModel):
    quantity_delivered: Optional[float] = None
    delivery_status: Optional[str] = None
    delivery_date: Optional[date] = None
    delivery_time: Optional[time] = None

class BulkUpdateLogsPartner(BaseModel):
    customer_ids: List[int]
    new_partner_id: int
    
class PaymentCreate(BaseModel):
    customer_id: int
    amount: float
    payment_mode: str
    for_month: str

class Payment(PaymentCreate):
    class Config:
        from_attributes = True
    id: int
    payment_date: date
    updated_at: datetime

class PaymentUpdate(BaseModel):
    customer_id: Optional[int] = None
    amount: Optional[float] = None
    payment_mode: Optional[str] = None
    for_month: Optional[str] = None
    payment_date: Optional[date] = None