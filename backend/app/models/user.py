import uuid
from sqlalchemy import String, Boolean, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False)
    role: Mapped[str] = mapped_column(String(50), nullable=False, default="other")
    # admin   : full access + user management + company edit/delete
    # manager : full operational access, view-only for company & users
    # other   : read-only across all modules
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    organization: Mapped["Organization"] = relationship("Organization", back_populates="users")  # noqa: F821
    quotations_created: Mapped[list["Quotation"]] = relationship(back_populates="created_by_user", foreign_keys="Quotation.created_by")  # noqa: F821
    invoices_created: Mapped[list["Invoice"]] = relationship(back_populates="created_by_user", foreign_keys="Invoice.created_by")  # noqa: F821
    expenses_created: Mapped[list["Expense"]] = relationship(back_populates="created_by_user", foreign_keys="Expense.created_by")  # noqa: F821
    documents_uploaded: Mapped[list["Document"]] = relationship(back_populates="uploaded_by_user", foreign_keys="Document.uploaded_by")  # noqa: F821
