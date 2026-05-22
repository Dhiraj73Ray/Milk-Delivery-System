from database import Base
from sqlalchemy import Column, Integer, String, DateTime, Float, ForeignKey, Date, Time, UniqueConstraint
from sqlalchemy.sql import func

class DeliveryPartners(Base):
    __tablename__ = "delivery_partners"
    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    phone = Column(String, unique=True, nullable=False, index=True)
    area = Column(String, nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())


class MasterCustomers(Base):
    __tablename__  = "master_customers"
    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    phone = Column(String,  unique=True, nullable=False, index=True)
    address = Column(String, nullable=False)
    milk_type = Column(String, nullable=False)
    rate = Column(Float, nullable=False)
    delivery_partner_id = Column(Integer, ForeignKey("delivery_partners.id"), nullable=True)
    previous_balance = Column(Float, default=0)
    status = Column(String, nullable=False, server_default="active")
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())


class DeliveryLogs(Base):
    __tablename__ = "delivery_logs"
    id = Column(Integer, primary_key=True)
    delivery_partner_id = Column(Integer, ForeignKey("delivery_partners.id"), nullable=False)
    customer_id = Column(Integer, ForeignKey("master_customers.id"), nullable=False)
    delivery_status = Column(String, server_default="done")
    quantity_delivered = Column(Float, server_default="1.0")
    delivery_time = Column(Time, server_default=func.current_time(), nullable=False)
    delivery_date = Column(Date, server_default=func.current_date(), nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    __table_args__ = (
        UniqueConstraint("delivery_partner_id", "customer_id", "delivery_date"),
    )

class Payments(Base):
    __tablename__ = "payments"
    id = Column(Integer, primary_key=True)
    customer_id = Column(Integer, ForeignKey("master_customers.id"), nullable=False)
    amount = Column(Float, nullable=False)
    payment_mode = Column(String, nullable=True)
    for_month = Column(String, nullable=False)
    payment_date = Column(Date, server_default=func.current_date(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())


class MilkRates(Base):
    __tablename__ = "milk_rates"
    id = Column(Integer, primary_key=True)
    milk_type = Column(String, unique=True, nullable=False)
    rate = Column(Float, nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

class Users(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    phone = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, server_default="delivery_partner")  # "admin" or "delivery_partner"
    delivery_partner_id = Column(Integer, ForeignKey("delivery_partners.id"), nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())