from database import SessionLocal
from models import DeliveryPartners, MasterCustomers, DeliveryLogs, Payments, MilkRates
from datetime import date, timedelta
import random

db = SessionLocal()

# --- 1. Seed Milk Rates ---
milk_rates_data = [
    {"milk_type": "kesav srishti", "rate": 120.0},
    {"milk_type": "Go-Amrut", "rate": 75.0},
    {"milk_type": "Raw Milk", "rate": 90.0},
]
for mr in milk_rates_data:
    exists = db.query(MilkRates).filter(MilkRates.milk_type == mr["milk_type"]).first()
    if not exists:
        db.add(MilkRates(**mr))
db.commit()
print("✅ Milk rates seeded")

# --- 2. Seed Partners ---
partners_data = [
    "Rahul Roy", "Lankesh Sahu", "Roshan Roy", "Rishi Yadav",
    "Pankaj Dudhat", "Ravi Verma", "Jitu Damai", "Randheer Yadav",
    "Pawan", "Ashwin Pathak", "Ramesh Yadav", "Surya Yadav",
    "Sam Surve", "Bipin Prabhu", "Aman Verma", "Tukan Ray",
    "Sunil Prabhu", "Ramji", "Manish", "Om Parkash",
    "Prem Bhai", "Sujit Roy"
]
partner_map = {}  # name → id
for name in partners_data:
    exists = db.query(DeliveryPartners).filter(DeliveryPartners.name == name).first()
    if not exists:
        p = DeliveryPartners(name=name, phone=f"9{''.join([str(random.randint(0,9)) for _ in range(9)])}", area="Mumbai")
        db.add(p)
        db.commit()
        db.refresh(p)
        partner_map[name] = p.id
    else:
        partner_map[name] = exists.id
print("✅ Partners seeded")

# --- 3. Import Customers from Excel ---
import openpyxl
wb = openpyxl.load_workbook("customers.xlsx")
ws = wb.active

# Name normalization for partners
name_fixes = {
    "pawan": "Pawan",
    "Panakj Dudhat": "Pankaj Dudhat",
    "Ravi": "Ravi Verma",
    "Ravi Prabhu": "Ravi Verma",
}

skipped = 0
for i, row in enumerate(ws.iter_rows(min_row=2, values_only=True), start=2):
    if i > 51:  # 50 customers only
        break
    sr, name, phone, partner_name, milk_type, rate = row

    if not name or not phone:
        skipped += 1
        continue

    partner_name = name_fixes.get(str(partner_name).strip(), str(partner_name).strip())
    partner_id = partner_map.get(partner_name)

    rate = float(rate) if rate else 75.0  # default for empty rate

    phone = str(int(phone)) if phone else None  # remove .0 from Excel numbers

    exists = db.query(MasterCustomers).filter(MasterCustomers.phone == phone).first()
    if not exists:
        db.add(MasterCustomers(
            name=str(name).strip(),
            phone=phone,
            address="Mumbai",
            milk_type=str(milk_type).strip(),
            rate=rate,
            delivery_partner_id=partner_id,
            previous_balance=random.choice([0, 0, 0, 500, 1000, 1500])
        ))
db.commit()
print(f"✅ Customers imported (skipped {skipped})")

# --- 4. Generate Dummy Delivery Logs (3 months) ---
customers = db.query(MasterCustomers).all()
months = [
    (2026, 1),
    (2026, 2),
    (2026, 3),
]

for year, month in months:
    if month == 12:
        next_month = date(year + 1, 1, 1)
    else:
        next_month = date(year, month + 1, 1)
    first_day = date(year, month, 1)
    days_in_month = (next_month - first_day).days

    for customer in customers:
        if not customer.delivery_partner_id:
            continue

        # each customer gets a "base" litre for the month — mostly consistent
        base_qty = random.choice([1.0, 1.5, 2.0])

        for day in range(1, days_in_month + 1):
            delivery_date = date(year, month, day)

            # 10% chance — no log at all (partner just skipped logging)
            if random.random() < 0.10:
                continue

            # 8% chance — cancelled
            if random.random() < 0.08:
                status = "cancelled"
                qty = 0.0
            # 7% chance — pending
            elif random.random() < 0.07:
                status = "pending"
                qty = 0.0
            else:
                status = "done"
                # 20% chance this customer changes litres on this day
                if random.random() < 0.20:
                    qty = random.choice([0.5, 1.0, 1.5, 2.0, 2.5, 3.0])
                else:
                    qty = base_qty

            exists = db.query(DeliveryLogs).filter(
                DeliveryLogs.customer_id == customer.id,
                DeliveryLogs.delivery_partner_id == customer.delivery_partner_id,
                DeliveryLogs.delivery_date == delivery_date
            ).first()

            if not exists:
                db.add(DeliveryLogs(
                    delivery_partner_id=customer.delivery_partner_id,
                    customer_id=customer.id,
                    delivery_status=status,
                    quantity_delivered=qty,
                    delivery_date=delivery_date
                ))
    db.commit()
    print(f"✅ Delivery logs seeded for {year}-{month:02d}")

# --- 5. Generate Dummy Payments ---
for customer in customers:
    for year, month in months:
        # 70% chance customer paid something
        if random.random() < 0.70:
            db.add(Payments(
                customer_id=customer.id,
                amount=random.choice([500, 1000, 1500, 2000, 2500]),
                payment_mode=random.choice(["cash", "upi", "bank"]),
                for_month=f"{year}-{month:02d}",
            ))
db.commit()
print("✅ Payments seeded")

db.close()
print("\n🎉 All done! DB is ready for testing.")