from pydantic import BaseModel
from typing import Optional, Literal
from uuid import UUID
from datetime import datetime


CategoryType = Literal["product", "service", "expense"]


class CategoryCreate(BaseModel):
    type: CategoryType
    name: str


class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[CategoryType] = None


class CategoryResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: UUID
    organization_id: UUID
    type: str
    name: str
    created_at: datetime
