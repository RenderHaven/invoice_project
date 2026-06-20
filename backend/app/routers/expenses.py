import uuid
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.dependencies import get_current_user, require_admin_or_manager
from app.models.user import User
from app.models.expense import Expense, ExpenseAttachment
from app.schemas.expense import ExpenseCreate, ExpenseUpdate, ExpenseResponse, AttachmentResponse
from app.services import cloudinary_service

router = APIRouter(prefix="/expenses", tags=["Expenses"])


def _exp_base(org_id):
    return (
        select(Expense)
        .where(Expense.organization_id == org_id)
        .options(selectinload(Expense.attachments))
    )


@router.get("", response_model=dict)
async def list_expenses(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(_exp_base(current_user.organization_id).offset((page - 1) * limit).limit(limit))
    items = result.scalars().all()
    return {"success": True, "data": [ExpenseResponse.model_validate(e).model_dump() for e in items]}


@router.get("/{expense_id}", response_model=dict)
async def get_expense(
    expense_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(_exp_base(current_user.organization_id).where(Expense.id == expense_id))
    exp = result.scalar_one_or_none()
    if not exp:
        raise HTTPException(status_code=404, detail="Expense not found")
    return {"success": True, "data": ExpenseResponse.model_validate(exp).model_dump()}


@router.post("", response_model=dict, status_code=201)
async def create_expense(
    payload: ExpenseCreate,
    current_user: User = Depends(require_admin_or_manager),
    db: AsyncSession = Depends(get_db),
):
    exp = Expense(
        id=uuid.uuid4(),
        organization_id=current_user.organization_id,
        created_by=current_user.id,
        **payload.model_dump(),
    )
    db.add(exp)
    await db.commit()
    await db.refresh(exp)
    res = await db.execute(_exp_base(current_user.organization_id).where(Expense.id == exp.id))
    return {"success": True, "data": ExpenseResponse.model_validate(res.scalar_one()).model_dump()}


@router.put("/{expense_id}", response_model=dict)
async def update_expense(
    expense_id: uuid.UUID,
    payload: ExpenseUpdate,
    current_user: User = Depends(require_admin_or_manager),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Expense).where(Expense.id == expense_id, Expense.organization_id == current_user.organization_id)
    )
    exp = result.scalar_one_or_none()
    if not exp:
        raise HTTPException(status_code=404, detail="Expense not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(exp, field, value)
    await db.commit()
    await db.refresh(exp)
    res = await db.execute(_exp_base(current_user.organization_id).where(Expense.id == expense_id))
    return {"success": True, "data": ExpenseResponse.model_validate(res.scalar_one()).model_dump()}


@router.delete("/{expense_id}", response_model=dict)
async def delete_expense(
    expense_id: uuid.UUID,
    current_user: User = Depends(require_admin_or_manager),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Expense).where(Expense.id == expense_id, Expense.organization_id == current_user.organization_id)
    )
    exp = result.scalar_one_or_none()
    if not exp:
        raise HTTPException(status_code=404, detail="Expense not found")
    await db.delete(exp)
    await db.commit()
    return {"success": True, "data": None}


@router.post("/{expense_id}/attachments", response_model=dict)
async def upload_attachment(
    expense_id: uuid.UUID,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Expense).where(Expense.id == expense_id, Expense.organization_id == current_user.organization_id)
    )
    exp = result.scalar_one_or_none()
    if not exp:
        raise HTTPException(status_code=404, detail="Expense not found")

    upload_result = await cloudinary_service.upload_file(file, folder="finance_platform/expenses")
    attachment = ExpenseAttachment(
        id=uuid.uuid4(),
        expense_id=expense_id,
        **upload_result,
    )
    db.add(attachment)
    await db.commit()
    await db.refresh(attachment)
    return {"success": True, "data": AttachmentResponse.model_validate(attachment).model_dump()}


@router.get("/{expense_id}/attachments", response_model=dict)
async def list_attachments(
    expense_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ExpenseAttachment).where(ExpenseAttachment.expense_id == expense_id)
    )
    items = result.scalars().all()
    return {"success": True, "data": [AttachmentResponse.model_validate(a).model_dump() for a in items]}
