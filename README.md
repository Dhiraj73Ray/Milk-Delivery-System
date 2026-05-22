# Milk Delivery System

Complete milk delivery management system with Admin and Partner dashboards.

## Features

- **Admin Dashboard**: Manage customers, partners, users, DSR reports, bills, payments
- **Partner Dashboard**: View assigned customers, log deliveries, view/edit logs
- **Mobile Responsive**: Works on desktop and mobile devices
- **Excel Exports**: Export DSR and billing data
- **Authentication**: Role-based access (Admin/Partner)

## Tech Stack

- **Backend**: FastAPI, PostgreSQL, SQLAlchemy
- **Frontend**: React, Tailwind CSS, Vite

## Setup Instructions

### Backend
```bash
cd Backend
pip install -r requirements.txt
uvicorn main:app --reload