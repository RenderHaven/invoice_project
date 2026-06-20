from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime


class BankAccountCreate(BaseModel):
    holder_name: Optional[str] = None
    bank_name: Optional[str] = None
    account_number: Optional[str] = None
    ifsc_code: Optional[str] = None
    upi_id: Optional[str] = None


class BankAccountUpdate(BankAccountCreate):
    pass


class BankAccountResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: UUID
    holder_name: Optional[str] = None
    bank_name: Optional[str] = None
    account_number: Optional[str] = None
    ifsc_code: Optional[str] = None
    upi_id: Optional[str] = None
    created_at: datetime
