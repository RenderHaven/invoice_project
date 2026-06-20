from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.dependencies import get_current_user, require_admin
from app.models.user import User
from app.models.organization import Organization
from app.schemas.organization import OrganizationResponse, OrganizationUpdate

router = APIRouter(prefix="/organization", tags=["Organization"])


@router.get("", response_model=dict)
async def get_organization(
    current_user: User = Depends(get_current_user),   # all roles can view
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Organization).where(Organization.id == current_user.organization_id)
    )
    org = result.scalar_one_or_none()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    return {"success": True, "data": OrganizationResponse.model_validate(org).model_dump()}


@router.put("", response_model=dict)
async def update_organization(
    payload: OrganizationUpdate,
    current_user: User = Depends(require_admin),   # admin only
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Organization).where(Organization.id == current_user.organization_id)
    )
    org = result.scalar_one_or_none()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(org, field, value)

    await db.commit()
    await db.refresh(org)
    return {"success": True, "data": OrganizationResponse.model_validate(org).model_dump()}
