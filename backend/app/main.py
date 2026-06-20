from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import (
    auth,
    organization,
    addresses,
    bank_accounts,
    customers,
    vendors,
    categories,
    items,
    quotations,
    invoices,
    payments,
    expenses,
    dashboard,
    gst,
    documents,
    users,
)

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Finance, Accounting & Billing Platform API",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Register all routers under /api/v1 ────────────────────────────────────────
PREFIX = "/api/v1"

app.include_router(auth.router, prefix=PREFIX)
app.include_router(users.router, prefix=PREFIX)
app.include_router(organization.router, prefix=PREFIX)
app.include_router(addresses.router, prefix=PREFIX)
app.include_router(bank_accounts.router, prefix=PREFIX)
app.include_router(customers.router, prefix=PREFIX)
app.include_router(vendors.router, prefix=PREFIX)
app.include_router(categories.router, prefix=PREFIX)
app.include_router(items.router, prefix=PREFIX)
app.include_router(quotations.router, prefix=PREFIX)
app.include_router(invoices.router, prefix=PREFIX)
app.include_router(payments.router, prefix=PREFIX)
app.include_router(expenses.router, prefix=PREFIX)
app.include_router(dashboard.router, prefix=PREFIX)
app.include_router(gst.router, prefix=PREFIX)
app.include_router(documents.router, prefix=PREFIX)


@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "ok", "version": settings.APP_VERSION}

@app.get(f"{PREFIX}/health", tags=["Health"])
async def api_health_check():
    return {"status": "ok", "version": settings.APP_VERSION}


@app.get("/", tags=["Root"])
async def root():
    return {"message": f"Welcome to {settings.APP_NAME}", "docs": "/docs"}
