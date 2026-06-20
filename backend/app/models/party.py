import uuid
from sqlalchemy import String, DateTime, ForeignKey, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base


class Party(Base):
    """Unified table for customers and vendors."""
    __tablename__ = "parties"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False)
    type: Mapped[str] = mapped_column(String(20), nullable=False)
    # customer | vendor | both
    business_name: Mapped[str] = mapped_column(String(255), nullable=False)
    contact_person: Mapped[str | None] = mapped_column(String(255))
    gst_number: Mapped[str | None] = mapped_column(String(20))
    email: Mapped[str | None] = mapped_column(String(255))
    phone: Mapped[str | None] = mapped_column(String(20))
    address_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("addresses.id"))
    bank_account_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("bank_accounts.id"))
    notes: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    organization: Mapped["Organization"] = relationship("Organization", back_populates="parties")  # noqa: F821
    address: Mapped["Address | None"] = relationship("Address", back_populates="parties")  # noqa: F821
    bank_account: Mapped["BankAccount | None"] = relationship("BankAccount", back_populates="parties")  # noqa: F821
    quotations: Mapped[list["Quotation"]] = relationship(back_populates="customer", foreign_keys="Quotation.customer_id")  # noqa: F821
    invoices: Mapped[list["Invoice"]] = relationship(back_populates="customer", foreign_keys="Invoice.customer_id")  # noqa: F821
    payments: Mapped[list["Payment"]] = relationship(back_populates="customer", foreign_keys="Payment.customer_id")  # noqa: F821
    expenses: Mapped[list["Expense"]] = relationship(back_populates="vendor", foreign_keys="Expense.vendor_id")  # noqa: F821
