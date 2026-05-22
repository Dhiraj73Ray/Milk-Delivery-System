from fastapi import FastAPI
from dotenv import load_dotenv
import os
from database import Base, connection
# from models import DeliveryPartners, MasterCustomers, DeliveryLogs, Payments
from routers import delivery_partners, master_customers, delivery_logs, payments, bills, dsr, milk_rates, export
from auth import auth_router
from fastapi.middleware.cors import CORSMiddleware


load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
print(DATABASE_URL)
app = FastAPI()

Base.metadata.create_all(bind=connection)

@app.get("/")
async def root():
    return {"message": "Hello World"}


app.include_router(delivery_partners.router)
app.include_router(master_customers.router)
app.include_router(delivery_logs.router)
app.include_router(payments.router)
app.include_router(bills.router)
app.include_router(dsr.router)
app.include_router(milk_rates.router)
app.include_router(export.router)
app.include_router(auth_router.router)



app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://milk-delivery-system-eight.vercel.app",
        "https://milk-delivery-system-git-main-dhiraj-rays-projects.vercel.app",
        "https://*.vercel.app"  # Allow all Vercel subdomains
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)