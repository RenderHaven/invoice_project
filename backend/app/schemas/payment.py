from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import date, datetime
from decimal import Decimal


class PaymentCreate(BaseModel):
    invoice_id: UUID
    customer_id: UUID
    payment_date: date
    amount: Decimal
    payment_method: Optional[str] = None
    reference_number: Optional[str] = None
    notes: Optional[str] = None


class PaymentResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: UUID
    organization_id: UUID
    invoice_id: UUID
    customer_id: UUID
    payment_date: date
    amount: Decimal
    payment_method: Optional[str] = None
    reference_number: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime
