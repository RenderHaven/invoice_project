from pydantic import BaseModel
from typing import Optional, List
from uuid import UUID
from datetime import date, datetime
from decimal import Decimal


class ExpenseCreate(BaseModel):
    vendor_id: Optional[UUID] = None
    category_id: Optional[UUID] = None
    expense_date: date
    description: Optional[str] = None
    amount: Decimal
    gst_amount: Decimal = Decimal("0")
    payment_method: Optional[str] = None
    reference_number: Optional[str] = None


class ExpenseUpdate(BaseModel):
    vendor_id: Optional[UUID] = None
    category_id: Optional[UUID] = None
    expense_date: Optional[date] = None
    description: Optional[str] = None
    amount: Optional[Decimal] = None
    gst_amount: Optional[Decimal] = None
    payment_method: Optional[str] = None
    reference_number: Optional[str] = None


class AttachmentResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: UUID
    expense_id: UUID
    file_url: str
    file_name: Optional[str] = None
    created_at: datetime


class ExpenseResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: UUID
    organization_id: UUID
    vendor_id: Optional[UUID] = None
    category_id: Optional[UUID] = None
    expense_date: date
    description: Optional[str] = None
    amount: Decimal
    gst_amount: Decimal
    payment_method: Optional[str] = None
    reference_number: Optional[str] = None
    created_by: UUID
    created_at: datetime
    attachments: List[AttachmentResponse] = []
