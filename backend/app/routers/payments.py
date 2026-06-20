import uuid
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.dependencies import get_current_user, require_admin_or_manager
from app.models.user import User
from app.models.payment import Payment
from app.schemas.payment import PaymentCreate, PaymentResponse

router = APIRouter(prefix="/payments", tags=["Payments"])


@router.get("", response_model=dict)
async def list_payments(
    invoice_id: uuid.UUID = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    q = select(Payment).where(Payment.organization_id == current_user.organization_id)
    if invoice_id:
        q = q.where(Payment.invoice_id == invoice_id)
    result = await db.execute(q.offset((page - 1) * limit).limit(limit))
    items = result.scalars().all()
    return {"success": True, "data": [PaymentResponse.model_validate(p).model_dump() for p in items]}


@router.get("/{payment_id}", response_model=dict)
async def get_payment(
    payment_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Payment).where(Payment.id == payment_id, Payment.organization_id == current_user.organization_id)
    )
    payment = result.scalar_one_or_none()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    return {"success": True, "data": PaymentResponse.model_validate(payment).model_dump()}


@router.post("", response_model=dict, status_code=201)
async def record_payment(
    payload: PaymentCreate,
    current_user: User = Depends(require_admin_or_manager),
    db: AsyncSession = Depends(get_db),
):
    payment = Payment(
        id=uuid.uuid4(),
        organization_id=current_user.organization_id,
        **payload.model_dump(),
    )
    db.add(payment)
    await db.commit()
    await db.refresh(payment)
    return {"success": True, "data": PaymentResponse.model_validate(payment).model_dump()}


@router.delete("/{payment_id}", response_model=dict)
async def delete_payment(
    payment_id: uuid.UUID,
    current_user: User = Depends(require_admin_or_manager),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Payment).where(Payment.id == payment_id, Payment.organization_id == current_user.organization_id)
    )
    payment = result.scalar_one_or_none()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    await db.delete(payment)
    await db.commit()
    return {"success": True, "data": None}
