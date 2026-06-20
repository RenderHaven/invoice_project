import uuid
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.dependencies import get_current_user, require_admin_or_manager
from app.models.user import User
from app.models.party import Party
from app.models.address import Address
from app.models.bank_account import BankAccount
from app.schemas.party import PartyCreate, PartyUpdate, PartyResponse

router = APIRouter(prefix="/customers", tags=["Customers"])


def _party_query(org_id):
    return (
        select(Party)
        .where(Party.organization_id == org_id, Party.type.in_(["customer", "both"]))
        .options(selectinload(Party.address), selectinload(Party.bank_account))
    )


@router.get("", response_model=dict)
async def list_customers(
    search: str = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    q = _party_query(current_user.organization_id)
    if search:
        q = q.where(or_(
            Party.business_name.ilike(f"%{search}%"),
            Party.email.ilike(f"%{search}%"),
            Party.phone.ilike(f"%{search}%"),
        ))
    result = await db.execute(q.offset((page - 1) * limit).limit(limit))
    items = result.scalars().all()
    return {"success": True, "data": [PartyResponse.model_validate(c).model_dump() for c in items]}


@router.get("/{customer_id}", response_model=dict)
async def get_customer(
    customer_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        _party_query(current_user.organization_id).where(Party.id == customer_id)
    )
    party = result.scalar_one_or_none()
    if not party:
        raise HTTPException(status_code=404, detail="Customer not found")
    return {"success": True, "data": PartyResponse.model_validate(party).model_dump()}


@router.post("", response_model=dict, status_code=201)
async def create_customer(
    payload: PartyCreate,
    current_user: User = Depends(require_admin_or_manager),
    db: AsyncSession = Depends(get_db),
):
    address_id = None
    bank_account_id = None

    if payload.address:
        addr = Address(id=uuid.uuid4(), **payload.address.model_dump())
        db.add(addr)
        await db.flush()
        address_id = addr.id

    if payload.bank_account:
        ba = BankAccount(id=uuid.uuid4(), **payload.bank_account.model_dump())
        db.add(ba)
        await db.flush()
        bank_account_id = ba.id

    data = payload.model_dump(exclude={"address", "bank_account"})
    party = Party(
        id=uuid.uuid4(),
        organization_id=current_user.organization_id,
        address_id=address_id,
        bank_account_id=bank_account_id,
        **data,
    )
    db.add(party)
    await db.commit()
    await db.refresh(party)
    result = await db.execute(_party_query(current_user.organization_id).where(Party.id == party.id))
    party = result.scalar_one()
    return {"success": True, "data": PartyResponse.model_validate(party).model_dump()}


@router.put("/{customer_id}", response_model=dict)
async def update_customer(
    customer_id: uuid.UUID,
    payload: PartyUpdate,
    current_user: User = Depends(require_admin_or_manager),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Party).where(Party.id == customer_id, Party.organization_id == current_user.organization_id)
    )
    party = result.scalar_one_or_none()
    if not party:
        raise HTTPException(status_code=404, detail="Customer not found")

    update_data = payload.model_dump(exclude_unset=True, exclude={"address", "bank_account"})
    for field, value in update_data.items():
        setattr(party, field, value)

    await db.commit()
    await db.refresh(party)
    res = await db.execute(_party_query(current_user.organization_id).where(Party.id == party.id))
    party = res.scalar_one()
    return {"success": True, "data": PartyResponse.model_validate(party).model_dump()}


@router.delete("/{customer_id}", response_model=dict)
async def delete_customer(
    customer_id: uuid.UUID,
    current_user: User = Depends(require_admin_or_manager),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Party).where(Party.id == customer_id, Party.organization_id == current_user.organization_id)
    )
    party = result.scalar_one_or_none()
    if not party:
        raise HTTPException(status_code=404, detail="Customer not found")
    await db.delete(party)
    await db.commit()
    return {"success": True, "data": None}
