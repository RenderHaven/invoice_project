from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime


class AddressCreate(BaseModel):
    line1: Optional[str] = None
    line2: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    postal_code: Optional[str] = None


class AddressUpdate(AddressCreate):
    pass


class AddressResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: UUID
    line1: Optional[str] = None
    line2: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    postal_code: Optional[str] = None
    created_at: datetime
