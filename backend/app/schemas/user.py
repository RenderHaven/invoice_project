from pydantic import BaseModel, EmailStr
from typing import Optional, Literal
from uuid import UUID
from datetime import datetime

UserRole = Literal["admin", "manager", "other"]


class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: UserRole = "other"


class UserResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: UUID
    organization_id: UUID
    role: str
    name: str
    email: str
    is_active: bool
    created_at: datetime


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


class ResetPasswordRequest(BaseModel):
    new_password: str
