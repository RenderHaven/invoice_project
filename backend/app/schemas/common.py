from typing import Generic, TypeVar, Optional, Any
from pydantic import BaseModel

T = TypeVar("T")


class SuccessResponse(BaseModel):
    success: bool = True
    data: Any = None


class ErrorResponse(BaseModel):
    success: bool = False
    message: str


class PaginatedResponse(BaseModel, Generic[T]):
    success: bool = True
    data: list[T]
    total: int
    page: int
    limit: int
    pages: int


class PaginationParams(BaseModel):
    page: int = 1
    limit: int = 20
    search: Optional[str] = None
    sort: Optional[str] = "created_at"
    order: Optional[str] = "desc"
