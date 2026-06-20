from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.models.invoice import Invoice
from app.models.quotation import Quotation
from app.models.organization import Organization


async def generate_invoice_number(db: AsyncSession, organization_id, prefix: str) -> str:
    result = await db.execute(
        select(func.count(Invoice.id)).where(Invoice.organization_id == organization_id)
    )
    count = result.scalar() or 0
    return f"{prefix}-{str(count + 1).zfill(4)}"


async def generate_quotation_number(db: AsyncSession, organization_id, prefix: str) -> str:
    result = await db.execute(
        select(func.count(Quotation.id)).where(Quotation.organization_id == organization_id)
    )
    count = result.scalar() or 0
    return f"{prefix}-{str(count + 1).zfill(4)}"
