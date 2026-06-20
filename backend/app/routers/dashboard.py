from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, case
from decimal import Decimal
from datetime import date

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.invoice import Invoice
from app.models.payment import Payment
from app.models.expense import Expense
from app.models.party import Party

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("", response_model=dict)
async def dashboard_summary(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    org_id = current_user.organization_id

    # Revenue = sum of paid invoice totals
    rev_result = await db.execute(
        select(func.coalesce(func.sum(Invoice.total_amount), 0))
        .where(Invoice.organization_id == org_id, Invoice.status == "paid")
    )
    total_revenue = rev_result.scalar() or Decimal("0")

    # Expenses
    exp_result = await db.execute(
        select(func.coalesce(func.sum(Expense.amount), 0))
        .where(Expense.organization_id == org_id)
    )
    total_expenses = exp_result.scalar() or Decimal("0")

    # Receivables = sum of sent/overdue invoice totals - payments received
    recv_result = await db.execute(
        select(func.coalesce(func.sum(Invoice.total_amount), 0))
        .where(Invoice.organization_id == org_id, Invoice.status.in_(["sent", "overdue"]))
    )
    total_receivables = recv_result.scalar() or Decimal("0")

    # GST
    gst_col = await db.execute(
        select(func.coalesce(func.sum(Invoice.gst_amount), 0))
        .where(Invoice.organization_id == org_id, Invoice.status == "paid")
    )
    gst_collected = gst_col.scalar() or Decimal("0")

    gst_paid_res = await db.execute(
        select(func.coalesce(func.sum(Expense.gst_amount), 0))
        .where(Expense.organization_id == org_id)
    )
    gst_paid = gst_paid_res.scalar() or Decimal("0")

    return {
        "success": True,
        "data": {
            "total_revenue": str(total_revenue),
            "total_expenses": str(total_expenses),
            "net_profit": str(Decimal(str(total_revenue)) - Decimal(str(total_expenses))),
            "total_receivables": str(total_receivables),
            "total_payables": "0",
            "gst_collected": str(gst_collected),
            "gst_paid": str(gst_paid),
            "net_gst_liability": str(Decimal(str(gst_collected)) - Decimal(str(gst_paid))),
        },
    }


@router.get("/overview", response_model=dict)
async def financial_overview(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await dashboard_summary(current_user=current_user, db=db)


@router.get("/receivables", response_model=dict)
async def receivables(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    org_id = current_user.organization_id
    result = await db.execute(
        select(
            Party.id,
            Party.business_name,
            func.coalesce(func.sum(Invoice.total_amount), 0).label("total_invoiced"),
        )
        .join(Invoice, Invoice.customer_id == Party.id)
        .where(Invoice.organization_id == org_id, Invoice.status.in_(["sent", "overdue"]))
        .group_by(Party.id, Party.business_name)
    )
    rows = result.all()
    data = [
        {"customer_id": str(r[0]), "business_name": r[1], "outstanding": str(r[2])}
        for r in rows
    ]
    return {"success": True, "data": data}


@router.get("/payables", response_model=dict)
async def payables(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    org_id = current_user.organization_id
    result = await db.execute(
        select(
            Party.id,
            Party.business_name,
            func.coalesce(func.sum(Expense.amount), 0).label("total_expenses"),
        )
        .join(Expense, Expense.vendor_id == Party.id)
        .where(Expense.organization_id == org_id)
        .group_by(Party.id, Party.business_name)
    )
    rows = result.all()
    data = [{"vendor_id": str(r[0]), "business_name": r[1], "total_expenses": str(r[2])} for r in rows]
    return {"success": True, "data": data}


@router.get("/gst", response_model=dict)
async def gst_dashboard(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    org_id = current_user.organization_id
    gst_col = await db.execute(
        select(func.coalesce(func.sum(Invoice.gst_amount), 0))
        .where(Invoice.organization_id == org_id, Invoice.status == "paid")
    )
    gst_paid_res = await db.execute(
        select(func.coalesce(func.sum(Expense.gst_amount), 0))
        .where(Expense.organization_id == org_id)
    )
    collected = Decimal(str(gst_col.scalar() or 0))
    paid = Decimal(str(gst_paid_res.scalar() or 0))
    return {
        "success": True,
        "data": {
            "gst_collected": str(collected),
            "gst_paid": str(paid),
            "net_liability": str(collected - paid),
        },
    }


@router.get("/revenue-trend", response_model=dict)
async def revenue_trend(
    period: str = Query("monthly"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    org_id = current_user.organization_id
    if period == "monthly":
        trunc = func.date_trunc("month", Invoice.invoice_date)
    elif period == "quarterly":
        trunc = func.date_trunc("quarter", Invoice.invoice_date)
    else:
        trunc = func.date_trunc("year", Invoice.invoice_date)

    result = await db.execute(
        select(trunc.label("period"), func.coalesce(func.sum(Invoice.total_amount), 0).label("revenue"))
        .where(Invoice.organization_id == org_id, Invoice.status == "paid")
        .group_by("period")
        .order_by("period")
    )
    rows = result.all()
    return {"success": True, "data": [{"period": str(r[0]), "revenue": str(r[1])} for r in rows]}


@router.get("/expense-trend", response_model=dict)
async def expense_trend(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    org_id = current_user.organization_id
    result = await db.execute(
        select(
            func.date_trunc("month", Expense.expense_date).label("period"),
            func.coalesce(func.sum(Expense.amount), 0).label("expenses"),
        )
        .where(Expense.organization_id == org_id)
        .group_by("period")
        .order_by("period")
    )
    rows = result.all()
    return {"success": True, "data": [{"period": str(r[0]), "expenses": str(r[1])} for r in rows]}


@router.get("/invoice-status", response_model=dict)
async def invoice_status_summary(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    org_id = current_user.organization_id
    result = await db.execute(
        select(Invoice.status, func.count(Invoice.id).label("count"))
        .where(Invoice.organization_id == org_id)
        .group_by(Invoice.status)
    )
    rows = result.all()
    summary = {r[0]: r[1] for r in rows}
    return {
        "success": True,
        "data": {
            "draft": summary.get("draft", 0),
            "sent": summary.get("sent", 0),
            "paid": summary.get("paid", 0),
            "overdue": summary.get("overdue", 0),
            "cancelled": summary.get("cancelled", 0),
        },
    }


@router.get("/top-customers", response_model=dict)
async def top_customers(
    limit: int = Query(5),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    org_id = current_user.organization_id
    result = await db.execute(
        select(Party.id, Party.business_name, func.sum(Invoice.total_amount).label("total"))
        .join(Invoice, Invoice.customer_id == Party.id)
        .where(Invoice.organization_id == org_id, Invoice.status == "paid")
        .group_by(Party.id, Party.business_name)
        .order_by(func.sum(Invoice.total_amount).desc())
        .limit(limit)
    )
    rows = result.all()
    return {"success": True, "data": [{"customer_id": str(r[0]), "business_name": r[1], "total_revenue": str(r[2])} for r in rows]}


@router.get("/top-vendors", response_model=dict)
async def top_vendors(
    limit: int = Query(5),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    org_id = current_user.organization_id
    result = await db.execute(
        select(Party.id, Party.business_name, func.sum(Expense.amount).label("total"))
        .join(Expense, Expense.vendor_id == Party.id)
        .where(Expense.organization_id == org_id)
        .group_by(Party.id, Party.business_name)
        .order_by(func.sum(Expense.amount).desc())
        .limit(limit)
    )
    rows = result.all()
    return {"success": True, "data": [{"vendor_id": str(r[0]), "business_name": r[1], "total_expenses": str(r[2])} for r in rows]}


@router.get("/recent-activities", response_model=dict)
async def recent_activities(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    org_id = current_user.organization_id
    inv_result = await db.execute(
        select(Invoice).where(Invoice.organization_id == org_id)
        .order_by(Invoice.created_at.desc()).limit(5)
    )
    invoices = inv_result.scalars().all()

    exp_result = await db.execute(
        select(Expense).where(Expense.organization_id == org_id)
        .order_by(Expense.created_at.desc()).limit(5)
    )
    expenses = exp_result.scalars().all()

    activities = []
    for inv in invoices:
        activities.append({
            "type": "invoice",
            "id": str(inv.id),
            "description": f"Invoice {inv.invoice_number}",
            "amount": str(inv.total_amount),
            "date": str(inv.invoice_date or inv.created_at),
        })
    for exp in expenses:
        activities.append({
            "type": "expense",
            "id": str(exp.id),
            "description": exp.description or "Expense",
            "amount": str(exp.amount),
            "date": str(exp.expense_date),
        })

    activities.sort(key=lambda x: x["date"], reverse=True)
    return {"success": True, "data": activities[:10]}
