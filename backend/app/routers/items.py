import uuid
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_

from app.database import get_db
from app.dependencies import get_current_user, require_admin_or_manager
from app.models.user import User
from app.models.item import Item
from app.schemas.item import ItemCreate, ItemUpdate, ItemResponse

router = APIRouter(prefix="/items", tags=["Items"])


@router.get("", response_model=dict)
async def list_items(
    type: str = Query(None),
    search: str = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    q = select(Item).where(Item.organization_id == current_user.organization_id)
    if type:
        q = q.where(Item.type == type)
    if search:
        q = q.where(or_(Item.name.ilike(f"%{search}%"), Item.description.ilike(f"%{search}%")))
    result = await db.execute(q.offset((page - 1) * limit).limit(limit))
    items = result.scalars().all()
    return {"success": True, "data": [ItemResponse.model_validate(i).model_dump() for i in items]}


@router.get("/{item_id}", response_model=dict)
async def get_item(
    item_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Item).where(Item.id == item_id, Item.organization_id == current_user.organization_id)
    )
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return {"success": True, "data": ItemResponse.model_validate(item).model_dump()}


@router.post("", response_model=dict, status_code=201)
async def create_item(
    payload: ItemCreate,
    current_user: User = Depends(require_admin_or_manager),
    db: AsyncSession = Depends(get_db),
):
    item = Item(id=uuid.uuid4(), organization_id=current_user.organization_id, **payload.model_dump())
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return {"success": True, "data": ItemResponse.model_validate(item).model_dump()}


@router.put("/{item_id}", response_model=dict)
async def update_item(
    item_id: uuid.UUID,
    payload: ItemUpdate,
    current_user: User = Depends(require_admin_or_manager),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Item).where(Item.id == item_id, Item.organization_id == current_user.organization_id)
    )
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(item, field, value)
    await db.commit()
    await db.refresh(item)
    return {"success": True, "data": ItemResponse.model_validate(item).model_dump()}


@router.delete("/{item_id}", response_model=dict)
async def delete_item(
    item_id: uuid.UUID,
    current_user: User = Depends(require_admin_or_manager),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Item).where(Item.id == item_id, Item.organization_id == current_user.organization_id)
    )
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    await db.delete(item)
    await db.commit()
    return {"success": True, "data": None}
