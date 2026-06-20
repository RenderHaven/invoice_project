from pydantic import BaseModel
from typing import Optional, Literal, List
from uuid import UUID
from datetime import date, datetime
from decimal import Decimal


QuotationStatus = Literal["draft", "sent", "accepted", "rejected"]


class QuotationItemCreate(BaseModel):
    item_id: Optional[UUID] = None
    description: Optional[str] = None
    quantity: Decimal = Decimal("1")
    unit_price: Decimal = Decimal("0")
    gst_rate: Decimal = Decimal("0")


class QuotationItemResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: UUID
    quotation_id: UUID
    item_id: Optional[UUID] = None
    description: Optional[str] = None
    quantity: Decimal
    unit_price: Decimal
    gst_rate: Decimal
    gst_amount: Decimal
    line_total: Decimal


class QuotationCreate(BaseModel):
    customer_id: UUID
    quotation_date: Optional[date] = None
    valid_until: Optional[date] = None
    notes: Optional[str] = None
    line_items: List[QuotationItemCreate] = []


class QuotationUpdate(BaseModel):
    customer_id: Optional[UUID] = None
    quotation_date: Optional[date] = None
    valid_until: Optional[date] = None
    status: Optional[QuotationStatus] = None
    notes: Optional[str] = None
    line_items: Optional[List[QuotationItemCreate]] = None


class QuotationResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: UUID
    organization_id: UUID
    quotation_number: str
    customer_id: UUID
    quotation_date: Optional[date] = None
    valid_until: Optional[date] = None
    status: str
    notes: Optional[str] = None
    subtotal: Decimal
    gst_amount: Decimal
    total_amount: Decimal
    created_by: UUID
    created_at: datetime
    line_items: List[QuotationItemResponse] = []
