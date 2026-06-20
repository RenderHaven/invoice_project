from pydantic import BaseModel
from typing import Optional, Literal, List
from uuid import UUID
from datetime import date, datetime
from decimal import Decimal


InvoiceStatus = Literal["draft", "sent", "paid", "overdue", "cancelled"]


class InvoiceItemCreate(BaseModel):
    item_id: Optional[UUID] = None
    description: Optional[str] = None
    quantity: Decimal = Decimal("1")
    unit_price: Decimal = Decimal("0")
    gst_rate: Decimal = Decimal("0")


class InvoiceItemResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: UUID
    invoice_id: UUID
    item_id: Optional[UUID] = None
    description: Optional[str] = None
    quantity: Decimal
    unit_price: Decimal
    gst_rate: Decimal
    gst_amount: Decimal
    line_total: Decimal


class InvoiceCreate(BaseModel):
    customer_id: UUID
    quotation_id: Optional[UUID] = None
    invoice_date: Optional[date] = None
    due_date: Optional[date] = None
    notes: Optional[str] = None
    line_items: List[InvoiceItemCreate] = []


class InvoiceUpdate(BaseModel):
    customer_id: Optional[UUID] = None
    invoice_date: Optional[date] = None
    due_date: Optional[date] = None
    status: Optional[InvoiceStatus] = None
    notes: Optional[str] = None
    line_items: Optional[List[InvoiceItemCreate]] = None


class InvoiceResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: UUID
    organization_id: UUID
    invoice_number: str
    customer_id: UUID
    quotation_id: Optional[UUID] = None
    invoice_date: Optional[date] = None
    due_date: Optional[date] = None
    status: str
    notes: Optional[str] = None
    subtotal: Decimal
    gst_amount: Decimal
    total_amount: Decimal
    created_by: UUID
    created_at: datetime
    line_items: List[InvoiceItemResponse] = []
