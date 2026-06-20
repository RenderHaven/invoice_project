import uuid
from sqlalchemy import String, DateTime, ForeignKey, Text, Numeric, Boolean, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB
from app.database import Base


class Document(Base):
    __tablename__ = "documents"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False)
    uploaded_by: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    document_type: Mapped[str] = mapped_column(String(20), nullable=False)
    # invoice | quotation | receipt | bill
    file_url: Mapped[str] = mapped_column(Text, nullable=False)
    public_id: Mapped[str | None] = mapped_column(String(255))
    file_name: Mapped[str | None] = mapped_column(String(255))
    status: Mapped[str] = mapped_column(String(20), default="uploaded")
    # uploaded | processing | completed | failed
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    organization: Mapped["Organization"] = relationship("Organization", back_populates="documents")  # noqa: F821
    uploaded_by_user: Mapped["User"] = relationship("User", back_populates="documents_uploaded", foreign_keys=[uploaded_by])  # noqa: F821
    extraction: Mapped["ExtractedDocument | None"] = relationship(back_populates="document", uselist=False, cascade="all, delete-orphan")


class ExtractedDocument(Base):
    __tablename__ = "extracted_documents"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    document_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, unique=True)
    extracted_data: Mapped[dict | None] = mapped_column(JSONB)
    confidence_score: Mapped[float | None] = mapped_column(Numeric(5, 2))
    reviewed: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    document: Mapped["Document"] = relationship("Document", back_populates="extraction")
