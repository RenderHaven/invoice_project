import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.dependencies import get_current_user, require_admin_or_manager
from app.models.user import User
from app.models.address import Address
from app.schemas.address import AddressCreate, AddressUpdate, AddressResponse

router = APIRouter(prefix="/addresses", tags=["Addresses"])


@router.get("", response_model=dict)
async def list_addresses(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Address))
    items = result.scalars().all()
    return {"success": True, "data": [AddressResponse.model_validate(a).model_dump() for a in items]}


@router.get("/{address_id}", response_model=dict)
async def get_address(
    address_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Address).where(Address.id == address_id))
    addr = result.scalar_one_or_none()
    if not addr:
        raise HTTPException(status_code=404, detail="Address not found")
    return {"success": True, "data": AddressResponse.model_validate(addr).model_dump()}


@router.post("", response_model=dict, status_code=201)
async def create_address(
    payload: AddressCreate,
    current_user: User = Depends(require_admin_or_manager),
    db: AsyncSession = Depends(get_db),
):
    addr = Address(id=uuid.uuid4(), **payload.model_dump())
    db.add(addr)
    await db.commit()
    await db.refresh(addr)
    return {"success": True, "data": AddressResponse.model_validate(addr).model_dump()}


@router.put("/{address_id}", response_model=dict)
async def update_address(
    address_id: uuid.UUID,
    payload: AddressUpdate,
    current_user: User = Depends(require_admin_or_manager),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Address).where(Address.id == address_id))
    addr = result.scalar_one_or_none()
    if not addr:
        raise HTTPException(status_code=404, detail="Address not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(addr, field, value)
    await db.commit()
    await db.refresh(addr)
    return {"success": True, "data": AddressResponse.model_validate(addr).model_dump()}


@router.delete("/{address_id}", response_model=dict)
async def delete_address(
    address_id: uuid.UUID,
    current_user: User = Depends(require_admin_or_manager),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Address).where(Address.id == address_id))
    addr = result.scalar_one_or_none()
    if not addr:
        raise HTTPException(status_code=404, detail="Address not found")
    await db.delete(addr)
    await db.commit()
    return {"success": True, "data": None}
