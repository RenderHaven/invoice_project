from pydantic import BaseModel, EmailStr
from typing import Optional
from uuid import UUID
from datetime import datetime
from app.schemas.address import AddressResponse
from app.schemas.bank_account import BankAccountResponse


class OrganizationUpdate(BaseModel):
    name: Optional[str] = None
    gst_number: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    invoice_prefix: Optional[str] = None
    quotation_prefix: Optional[str] = None


class OrganizationResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: UUID
    name: str
    gst_number: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address_id: Optional[UUID] = None
    invoice_prefix: Optional[str] = None
    quotation_prefix: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    address: Optional[AddressResponse] = None
