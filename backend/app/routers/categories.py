import uuid
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.dependencies import get_current_user, require_admin_or_manager
from app.models.user import User
from app.models.category import Category
from app.schemas.category import CategoryCreate, CategoryUpdate, CategoryResponse

router = APIRouter(prefix="/categories", tags=["Categories"])


@router.get("", response_model=dict)
async def list_categories(
    type: str = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    q = select(Category).where(Category.organization_id == current_user.organization_id)
    if type:
        q = q.where(Category.type == type)
    result = await db.execute(q)
    items = result.scalars().all()
    return {"success": True, "data": [CategoryResponse.model_validate(c).model_dump() for c in items]}


@router.post("", response_model=dict, status_code=201)
async def create_category(
    payload: CategoryCreate,
    current_user: User = Depends(require_admin_or_manager),
    db: AsyncSession = Depends(get_db),
):
    cat = Category(id=uuid.uuid4(), organization_id=current_user.organization_id, **payload.model_dump())
    db.add(cat)
    await db.commit()
    await db.refresh(cat)
    return {"success": True, "data": CategoryResponse.model_validate(cat).model_dump()}


@router.put("/{category_id}", response_model=dict)
async def update_category(
    category_id: uuid.UUID,
    payload: CategoryUpdate,
    current_user: User = Depends(require_admin_or_manager),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Category).where(Category.id == category_id, Category.organization_id == current_user.organization_id)
    )
    cat = result.scalar_one_or_none()
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(cat, field, value)
    await db.commit()
    await db.refresh(cat)
    return {"success": True, "data": CategoryResponse.model_validate(cat).model_dump()}


@router.delete("/{category_id}", response_model=dict)
async def delete_category(
    category_id: uuid.UUID,
    current_user: User = Depends(require_admin_or_manager),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Category).where(Category.id == category_id, Category.organization_id == current_user.organization_id)
    )
    cat = result.scalar_one_or_none()
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    await db.delete(cat)
    await db.commit()
    return {"success": True, "data": None}
