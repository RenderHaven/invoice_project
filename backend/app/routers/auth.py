from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import uuid

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.organization import Organization
from app.schemas.auth import LoginRequest, RegisterRequest, LoginResponse, TokenResponse
from app.schemas.user import UserResponse, ChangePasswordRequest
from app.services.auth_service import hash_password, verify_password, create_access_token

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=LoginResponse, status_code=201)
async def register(payload: RegisterRequest, db: AsyncSession = Depends(get_db)):
    """
    Register a new organization.
    Creates the org and one admin user (role=admin) with the provided credentials.
    """
    # Check if email already exists
    existing = await db.execute(select(User).where(User.email == payload.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    # Create organization
    org = Organization(
        id=uuid.uuid4(),
        name=payload.org_name,
        invoice_prefix="INV",
        quotation_prefix="QUO",
    )
    db.add(org)
    await db.flush()

    # Create admin user with the org email + provided password
    user = User(
        id=uuid.uuid4(),
        organization_id=org.id,
        role="admin",
        name=payload.name,
        email=payload.email,
        password_hash=hash_password(payload.password),
        is_active=True,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    token = create_access_token(str(user.id))
    return LoginResponse(data=TokenResponse(token=token, user=UserResponse.model_validate(user)))


@router.post("/login", response_model=LoginResponse)
async def login(payload: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == payload.email))
    user = result.scalar_one_or_none()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Account is deactivated")

    token = create_access_token(str(user.id))
    return LoginResponse(data=TokenResponse(token=token, user=UserResponse.model_validate(user)))


@router.get("/me", response_model=dict)
async def get_me(current_user: User = Depends(get_current_user)):
    return {"success": True, "data": UserResponse.model_validate(current_user).model_dump()}


@router.put("/change-password", response_model=dict)
async def change_password(
    payload: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Any authenticated user can change their own password."""
    if not verify_password(payload.current_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    if payload.current_password == payload.new_password:
        raise HTTPException(status_code=400, detail="New password must be different from current password")

    current_user.password_hash = hash_password(payload.new_password)
    await db.commit()
    return {"success": True, "data": {"message": "Password changed successfully"}}
