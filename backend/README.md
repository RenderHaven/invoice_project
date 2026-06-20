# Finance, Accounting & Billing Platform — Backend

FastAPI + PostgreSQL + Cloudinary + Gemini Vision REST API.

---

## Quick Start

### 1. Prerequisites

```bash
# Python 3.11+
python --version

# PostgreSQL running locally or remote
psql --version
```

### 2. Install Dependencies

```bash
cd backend
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 3. Configure Environment

```bash
cp .env.example .env
# Edit .env with your values:
#   DATABASE_URL, JWT_SECRET_KEY, Cloudinary keys, GEMINI_API_KEY
```

### 4. Create PostgreSQL Database

```sql
CREATE DATABASE finance_platform;
```

### 5. Run Migrations

```bash
alembic upgrade head
```

### 6. Start Server

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Swagger UI: [http://localhost:8000/docs](http://localhost:8000/docs)

---

## API Base URL

```
/api/v1
```

## Authentication

```http
POST /api/v1/auth/register   # Create org + owner account
POST /api/v1/auth/login      # Get JWT token
GET  /api/v1/auth/me         # Get current user
```

All other endpoints require:
```http
Authorization: Bearer <token>
```

---

## Modules

| Module | Endpoints |
|---|---|
| Organization | `GET/PUT /organization` |
| Addresses | Full CRUD `/addresses` |
| Bank Accounts | Full CRUD `/bank-accounts` |
| Customers | Full CRUD `/customers` + search |
| Vendors | Full CRUD `/vendors` + search |
| Categories | Full CRUD `/categories` |
| Items | Full CRUD `/items` + type filter |
| Quotations | Full CRUD + accept/reject/convert/pdf |
| Invoices | Full CRUD + mark-sent/paid/cancel/pdf |
| Payments | CRUD `/payments` |
| Expenses | CRUD `/expenses` + attachment upload |
| Dashboard | Summary, trends, receivables, payables |
| GST | Summary with year/month filter |
| AI Documents | Upload, extract (Gemini Vision), create drafts |

---

## Project Structure

```
backend/
├── app/
│   ├── main.py          # FastAPI app, CORS, routers
│   ├── config.py        # Settings (env vars)
│   ├── database.py      # Async SQLAlchemy engine
│   ├── dependencies.py  # JWT auth dependency
│   ├── models/          # SQLAlchemy ORM models
│   ├── schemas/         # Pydantic request/response models
│   ├── routers/         # Route handlers (one file per module)
│   ├── services/        # PDF, Cloudinary, AI extraction, Auth
│   └── utils/           # GST calculator, number generator
├── alembic/             # DB migrations
├── requirements.txt
└── .env.example
```

---

## Key Design Decisions

- **Multi-tenancy**: All data is scoped by `organization_id` from the JWT token
- **Unified parties table**: Customers and vendors share a single `parties` table (`type = customer | vendor | both`)
- **PDF generation**: WeasyPrint renders HTML templates server-side
- **AI Extraction**: Google Gemini Vision (`gemini-1.5-flash`) parses uploaded documents
- **File Storage**: Cloudinary for all uploaded files (documents, expense receipts)
- **Sequential numbering**: Invoice and quotation numbers are org-scoped (e.g. `INV-0001`)
