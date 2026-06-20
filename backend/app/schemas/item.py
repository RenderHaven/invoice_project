from pydantic import BaseModel
from typing import Optional, Literal
from uuid import UUID
from datetime import datetime
from decimal import Decimal


ItemType = Literal["product", "service"]


class ItemCreate(BaseModel):
    type: ItemType
    category_id: Optional[UUID] = None
    name: str
    description: Optional[str] = None
    unit: Optional[str] = None
    sale_price: Optional[Decimal] = None
    gst_rate: Optional[Decimal] = None
    is_active: bool = True


class ItemUpdate(BaseModel):
    type: Optional[ItemType] = None
    category_id: Optional[UUID] = None
    name: Optional[str] = None
    description: Optional[str] = None
    unit: Optional[str] = None
    sale_price: Optional[Decimal] = None
    gst_rate: Optional[Decimal] = None
    is_active: Optional[bool] = None


class ItemResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: UUID
    organization_id: UUID
    type: str
    category_id: Optional[UUID] = None
    name: str
    description: Optional[str] = None
    unit: Optional[str] = None
    sale_price: Optional[Decimal] = None
    gst_rate: Optional[Decimal] = None
    is_active: bool
    created_at: datetime
