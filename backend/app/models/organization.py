import uuid
from sqlalchemy import String, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base


class Organization(Base):
    __tablename__ = "organizations"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    gst_number: Mapped[str | None] = mapped_column(String(20))
    email: Mapped[str | None] = mapped_column(String(255))
    phone: Mapped[str | None] = mapped_column(String(20))
    address_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("addresses.id"))
    invoice_prefix: Mapped[str | None] = mapped_column(String(10), default="INV")
    quotation_prefix: Mapped[str | None] = mapped_column(String(10), default="QUO")
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    address: Mapped["Address"] = relationship("Address", back_populates="organizations")  # noqa: F821
    users: Mapped[list["User"]] = relationship(back_populates="organization")  # noqa: F821
    parties: Mapped[list["Party"]] = relationship(back_populates="organization")  # noqa: F821
    categories: Mapped[list["Category"]] = relationship(back_populates="organization")  # noqa: F821
    items: Mapped[list["Item"]] = relationship(back_populates="organization")  # noqa: F821
    quotations: Mapped[list["Quotation"]] = relationship(back_populates="organization")  # noqa: F821
    invoices: Mapped[list["Invoice"]] = relationship(back_populates="organization")  # noqa: F821
    payments: Mapped[list["Payment"]] = relationship(back_populates="organization")  # noqa: F821
    expenses: Mapped[list["Expense"]] = relationship(back_populates="organization")  # noqa: F821
    documents: Mapped[list["Document"]] = relationship(back_populates="organization")  # noqa: F821
