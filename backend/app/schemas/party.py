from pydantic import BaseModel, EmailStr
from typing import Optional, Literal
from uuid import UUID
from datetime import datetime
from app.schemas.address import AddressResponse, AddressCreate
from app.schemas.bank_account import BankAccountResponse, BankAccountCreate


PartyType = Literal["customer", "vendor", "both"]


class PartyCreate(BaseModel):
    type: PartyType
    business_name: str
    contact_person: Optional[str] = None
    gst_number: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    notes: Optional[str] = None
    address: Optional[AddressCreate] = None
    bank_account: Optional[BankAccountCreate] = None


class PartyUpdate(BaseModel):
    business_name: Optional[str] = None
    contact_person: Optional[str] = None
    gst_number: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    notes: Optional[str] = None
    address: Optional[AddressCreate] = None
    bank_account: Optional[BankAccountCreate] = None


class PartyResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: UUID
    organization_id: UUID
    type: str
    business_name: str
    contact_person: Optional[str] = None
    gst_number: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    notes: Optional[str] = None
    address_id: Optional[UUID] = None
    bank_account_id: Optional[UUID] = None
    created_at: datetime
    address: Optional[AddressResponse] = None
    bank_account: Optional[BankAccountResponse] = None
