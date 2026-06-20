from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from decimal import Decimal

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.invoice import Invoice
from app.models.expense import Expense

router = APIRouter(prefix="/gst", tags=["GST"])


@router.get("/summary", response_model=dict)
async def gst_summary(
    year: int = Query(None),
    month: int = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    org_id = current_user.organization_id

    inv_q = select(func.coalesce(func.sum(Invoice.gst_amount), 0)).where(
        Invoice.organization_id == org_id, Invoice.status == "paid"
    )
    exp_q = select(func.coalesce(func.sum(Expense.gst_amount), 0)).where(
        Expense.organization_id == org_id
    )

    if year:
        inv_q = inv_q.where(func.extract("year", Invoice.invoice_date) == year)
        exp_q = exp_q.where(func.extract("year", Expense.expense_date) == year)
    if month:
        inv_q = inv_q.where(func.extract("month", Invoice.invoice_date) == month)
        exp_q = exp_q.where(func.extract("month", Expense.expense_date) == month)

    gst_collected = Decimal(str((await db.execute(inv_q)).scalar() or 0))
    gst_paid = Decimal(str((await db.execute(exp_q)).scalar() or 0))

    return {
        "success": True,
        "data": {
            "gst_collected": str(gst_collected),
            "gst_paid": str(gst_paid),
            "net_gst_liability": str(gst_collected - gst_paid),
            "filters": {"year": year, "month": month},
        },
    }
