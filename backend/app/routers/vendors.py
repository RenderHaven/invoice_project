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

router = APIRouter(prefix="/vendors", tags=["Vendors"])


def _vendor_query(org_id):
    return (
        select(Party)
        .where(Party.organization_id == org_id, Party.type.in_(["vendor", "both"]))
        .options(selectinload(Party.address), selectinload(Party.bank_account))
    )


@router.get("", response_model=dict)
async def list_vendors(
    search: str = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    q = _vendor_query(current_user.organization_id)
    if search:
        q = q.where(or_(
            Party.business_name.ilike(f"%{search}%"),
            Party.email.ilike(f"%{search}%"),
        ))
    result = await db.execute(q.offset((page - 1) * limit).limit(limit))
    items = result.scalars().all()
    return {"success": True, "data": [PartyResponse.model_validate(v).model_dump() for v in items]}


@router.get("/{vendor_id}", response_model=dict)
async def get_vendor(
    vendor_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        _vendor_query(current_user.organization_id).where(Party.id == vendor_id)
    )
    vendor = result.scalar_one_or_none()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    return {"success": True, "data": PartyResponse.model_validate(vendor).model_dump()}


@router.post("", response_model=dict, status_code=201)
async def create_vendor(
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
    vendor = Party(
        id=uuid.uuid4(),
        organization_id=current_user.organization_id,
        address_id=address_id,
        bank_account_id=bank_account_id,
        **data,
    )
    db.add(vendor)
    await db.commit()
    await db.refresh(vendor)
    res = await db.execute(_vendor_query(current_user.organization_id).where(Party.id == vendor.id))
    vendor = res.scalar_one()
    return {"success": True, "data": PartyResponse.model_validate(vendor).model_dump()}


@router.put("/{vendor_id}", response_model=dict)
async def update_vendor(
    vendor_id: uuid.UUID,
    payload: PartyUpdate,
    current_user: User = Depends(require_admin_or_manager),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Party).where(Party.id == vendor_id, Party.organization_id == current_user.organization_id)
    )
    vendor = result.scalar_one_or_none()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    for field, value in payload.model_dump(exclude_unset=True, exclude={"address", "bank_account"}).items():
        setattr(vendor, field, value)
    await db.commit()
    await db.refresh(vendor)
    res = await db.execute(_vendor_query(current_user.organization_id).where(Party.id == vendor.id))
    vendor = res.scalar_one()
    return {"success": True, "data": PartyResponse.model_validate(vendor).model_dump()}


@router.delete("/{vendor_id}", response_model=dict)
async def delete_vendor(
    vendor_id: uuid.UUID,
    current_user: User = Depends(require_admin_or_manager),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Party).where(Party.id == vendor_id, Party.organization_id == current_user.organization_id)
    )
    vendor = result.scalar_one_or_none()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    await db.delete(vendor)
    await db.commit()
    return {"success": True, "data": None}
