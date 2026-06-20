from pydantic import BaseModel
from typing import Optional, Any
from uuid import UUID
from datetime import datetime
from decimal import Decimal


class DocumentResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: UUID
    organization_id: UUID
    uploaded_by: UUID
    document_type: str
    file_url: str
    file_name: Optional[str] = None
    status: str
    created_at: datetime
    extraction: Optional["ExtractionResponse"] = None


class ExtractionResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: UUID
    document_id: UUID
    extracted_data: Optional[Any] = None
    confidence_score: Optional[Decimal] = None
    reviewed: bool
    created_at: datetime


DocumentResponse.model_rebuild()
