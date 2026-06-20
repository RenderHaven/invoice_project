import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.dependencies import get_current_user, require_admin
from app.models.user import User
from app.schemas.user import UserCreate, UserResponse, ResetPasswordRequest
from app.services.auth_service import hash_password

router = APIRouter(prefix="/users", tags=["User Management"])


@router.get("", response_model=dict)
async def list_users(
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """List all users in the organization. Admin only."""
    result = await db.execute(
        select(User).where(User.organization_id == current_user.organization_id)
        .order_by(User.created_at)
    )
    users = result.scalars().all()
    return {
        "success": True,
        "data": [UserResponse.model_validate(u).model_dump() for u in users],
    }


@router.get("/{user_id}", response_model=dict)
async def get_user(
    user_id: uuid.UUID,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Get a specific user's info. Admin only."""
    result = await db.execute(
        select(User).where(
            User.id == user_id,
            User.organization_id == current_user.organization_id,
        )
    )
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"success": True, "data": UserResponse.model_validate(user).model_dump()}


@router.post("", response_model=dict, status_code=201)
async def create_user(
    payload: UserCreate,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Create a new user in the same organization. Admin only."""
    # Check email uniqueness globally
    existing = await db.execute(select(User).where(User.email == payload.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already in use")

    user = User(
        id=uuid.uuid4(),
        organization_id=current_user.organization_id,
        role=payload.role,
        name=payload.name,
        email=payload.email,
        password_hash=hash_password(payload.password),
        is_active=True,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return {"success": True, "data": UserResponse.model_validate(user).model_dump()}


@router.delete("/{user_id}", response_model=dict)
async def delete_user(
    user_id: uuid.UUID,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Delete a user from the organization. Admin only. Admin cannot delete themselves."""
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot delete your own account")

    result = await db.execute(
        select(User).where(
            User.id == user_id,
            User.organization_id == current_user.organization_id,
        )
    )
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    await db.delete(user)
    await db.commit()
    return {"success": True, "data": {"message": f"User '{user.name}' deleted successfully"}}


@router.put("/{user_id}/reset-password", response_model=dict)
async def reset_user_password(
    user_id: uuid.UUID,
    payload: ResetPasswordRequest,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Admin resets another user's password directly (no current password needed)."""
    result = await db.execute(
        select(User).where(
            User.id == user_id,
            User.organization_id == current_user.organization_id,
        )
    )
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.password_hash = hash_password(payload.new_password)
    await db.commit()
    return {"success": True, "data": {"message": f"Password for '{user.name}' has been reset"}}
