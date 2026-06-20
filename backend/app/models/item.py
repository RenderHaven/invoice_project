import uuid
from sqlalchemy import String, Boolean, DateTime, ForeignKey, Text, Numeric, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base


class Item(Base):
    __tablename__ = "items"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False)
    type: Mapped[str] = mapped_column(String(20), nullable=False)
    # product | service
    category_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("categories.id"))
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    unit: Mapped[str | None] = mapped_column(String(50))
    sale_price: Mapped[float | None] = mapped_column(Numeric(12, 2))
    gst_rate: Mapped[float | None] = mapped_column(Numeric(5, 2))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    organization: Mapped["Organization"] = relationship("Organization", back_populates="items")  # noqa: F821
    category: Mapped["Category | None"] = relationship("Category", back_populates="items")  # noqa: F821
    quotation_items: Mapped[list["QuotationItem"]] = relationship(back_populates="item")  # noqa: F821
    invoice_items: Mapped[list["InvoiceItem"]] = relationship(back_populates="item")  # noqa: F821
