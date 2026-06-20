import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.dependencies import get_current_user, require_admin_or_manager
from app.models.user import User
from app.models.bank_account import BankAccount
from app.schemas.bank_account import BankAccountCreate, BankAccountUpdate, BankAccountResponse

router = APIRouter(prefix="/bank-accounts", tags=["Bank Accounts"])


@router.get("", response_model=dict)
async def list_bank_accounts(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(BankAccount))
    items = result.scalars().all()
    return {"success": True, "data": [BankAccountResponse.model_validate(b).model_dump() for b in items]}


@router.get("/{account_id}", response_model=dict)
async def get_bank_account(
    account_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(BankAccount).where(BankAccount.id == account_id))
    acc = result.scalar_one_or_none()
    if not acc:
        raise HTTPException(status_code=404, detail="Bank account not found")
    return {"success": True, "data": BankAccountResponse.model_validate(acc).model_dump()}


@router.post("", response_model=dict, status_code=201)
async def create_bank_account(
    payload: BankAccountCreate,
    current_user: User = Depends(require_admin_or_manager),
    db: AsyncSession = Depends(get_db),
):
    acc = BankAccount(id=uuid.uuid4(), **payload.model_dump())
    db.add(acc)
    await db.commit()
    await db.refresh(acc)
    return {"success": True, "data": BankAccountResponse.model_validate(acc).model_dump()}


@router.put("/{account_id}", response_model=dict)
async def update_bank_account(
    account_id: uuid.UUID,
    payload: BankAccountUpdate,
    current_user: User = Depends(require_admin_or_manager),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(BankAccount).where(BankAccount.id == account_id))
    acc = result.scalar_one_or_none()
    if not acc:
        raise HTTPException(status_code=404, detail="Bank account not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(acc, field, value)
    await db.commit()
    await db.refresh(acc)
    return {"success": True, "data": BankAccountResponse.model_validate(acc).model_dump()}


@router.delete("/{account_id}", response_model=dict)
async def delete_bank_account(
    account_id: uuid.UUID,
    current_user: User = Depends(require_admin_or_manager),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(BankAccount).where(BankAccount.id == account_id))
    acc = result.scalar_one_or_none()
    if not acc:
        raise HTTPException(status_code=404, detail="Bank account not found")
    await db.delete(acc)
    await db.commit()
    return {"success": True, "data": None}
