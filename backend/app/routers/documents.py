import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.dependencies import get_current_user, require_admin_or_manager
from app.models.user import User
from app.models.document import Document, ExtractedDocument
from app.models.invoice import Invoice, InvoiceItem
from app.models.expense import Expense
from app.schemas.document import DocumentResponse, ExtractionResponse
from app.services import cloudinary_service
from app.services.ai_extraction_service import extract_document
from app.utils.number_generator import generate_invoice_number
from app.utils.gst_calculator import calculate_line_totals, calculate_document_totals
from app.models.organization import Organization

router = APIRouter(prefix="/documents", tags=["AI Documents"])

ALLOWED_TYPES = {
    "image/jpeg": "image/jpeg",
    "image/png": "image/png",
    "application/pdf": "application/pdf",
}


def _doc_base(org_id):
    return (
        select(Document)
        .where(Document.organization_id == org_id)
        .options(selectinload(Document.extraction))
    )


@router.post("/upload", response_model=dict, status_code=201)
async def upload_document(
    file: UploadFile = File(...),
    document_type: str = Query("invoice"),
    current_user: User = Depends(require_admin_or_manager),
    db: AsyncSession = Depends(get_db),
):
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail="Only PDF, JPG, PNG files are supported")

    upload_result = await cloudinary_service.upload_file(file, folder="finance_platform/documents")
    doc = Document(
        id=uuid.uuid4(),
        organization_id=current_user.organization_id,
        uploaded_by=current_user.id,
        document_type=document_type,
        file_url=upload_result["file_url"],
        public_id=upload_result.get("public_id"),
        file_name=upload_result.get("file_name"),
        status="uploaded",
    )
    db.add(doc)
    await db.commit()
    await db.refresh(doc)
    res = await db.execute(_doc_base(current_user.organization_id).where(Document.id == doc.id))
    return {"success": True, "data": DocumentResponse.model_validate(res.scalar_one()).model_dump()}


@router.get("", response_model=dict)
async def list_documents(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        _doc_base(current_user.organization_id).offset((page - 1) * limit).limit(limit)
    )
    items = result.scalars().all()
    return {"success": True, "data": [DocumentResponse.model_validate(d).model_dump() for d in items]}


@router.get("/{document_id}", response_model=dict)
async def get_document(
    document_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        _doc_base(current_user.organization_id).where(Document.id == document_id)
    )
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return {"success": True, "data": DocumentResponse.model_validate(doc).model_dump()}


async def _run_extraction(document_id: uuid.UUID, current_user: User, db: AsyncSession) -> dict:
    result = await db.execute(
        select(Document).where(Document.id == document_id, Document.organization_id == current_user.organization_id)
    )
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    doc.status = "processing"
    await db.flush()

    import httpx
    async with httpx.AsyncClient() as client:
        resp = await client.get(doc.file_url)
        file_bytes = resp.content

    mime_type = "application/pdf" if doc.file_url.endswith(".pdf") else "image/jpeg"
    extraction_result = await extract_document(file_bytes, mime_type)

    existing = await db.execute(
        select(ExtractedDocument).where(ExtractedDocument.document_id == document_id)
    )
    existing_extraction = existing.scalar_one_or_none()

    if existing_extraction:
        existing_extraction.extracted_data = extraction_result.get("extracted_data")
        existing_extraction.confidence_score = extraction_result.get("confidence_score", 0)
    else:
        ext_doc = ExtractedDocument(
            id=uuid.uuid4(),
            document_id=document_id,
            extracted_data=extraction_result.get("extracted_data"),
            confidence_score=extraction_result.get("confidence_score", 0),
        )
        db.add(ext_doc)

    doc.status = "completed" if extraction_result.get("extracted_data") else "failed"
    await db.commit()
    res = await db.execute(_doc_base(current_user.organization_id).where(Document.id == document_id))
    return {"success": True, "data": DocumentResponse.model_validate(res.scalar_one()).model_dump()}


@router.post("/{document_id}/extract", response_model=dict)
async def extract(
    document_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await _run_extraction(document_id, current_user, db)


@router.post("/{document_id}/reprocess", response_model=dict)
async def reprocess(
    document_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await _run_extraction(document_id, current_user, db)


@router.get("/{document_id}/extraction", response_model=dict)
async def get_extraction(
    document_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ExtractedDocument).where(ExtractedDocument.document_id == document_id)
    )
    ext = result.scalar_one_or_none()
    if not ext:
        raise HTTPException(status_code=404, detail="Extraction not found")
    return {"success": True, "data": ExtractionResponse.model_validate(ext).model_dump()}


@router.post("/{document_id}/create-invoice", response_model=dict)
async def create_invoice_from_extraction(
    document_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ExtractedDocument).where(ExtractedDocument.document_id == document_id)
    )
    ext = result.scalar_one_or_none()
    if not ext or not ext.extracted_data:
        raise HTTPException(status_code=400, detail="No extraction data available")

    data = ext.extracted_data
    org_result = await db.execute(select(Organization).where(Organization.id == current_user.organization_id))
    org = org_result.scalar_one()
    inv_no = await generate_invoice_number(db, current_user.organization_id, org.invoice_prefix or "INV")

    inv_id = uuid.uuid4()
    line_items_data = data.get("line_items", [])
    line_items = []
    for li in line_items_data:
        from decimal import Decimal as D
        q = D(str(li.get("quantity", 1)))
        up = D(str(li.get("unit_price", 0)))
        gr = D(str(li.get("gst_rate", 0)))
        totals = calculate_line_totals(q, up, gr)
        line_items.append(InvoiceItem(
            id=uuid.uuid4(),
            invoice_id=inv_id,
            description=li.get("description", ""),
            quantity=q, unit_price=up, gst_rate=gr, **totals,
        ))

    li_dicts = [{"quantity": li.quantity, "unit_price": li.unit_price, "gst_amount": li.gst_amount} for li in line_items]
    totals = calculate_document_totals(li_dicts)

    invoice = Invoice(
        id=inv_id,
        organization_id=current_user.organization_id,
        invoice_number=inv_no,
        customer_id=current_user.organization_id,  # placeholder – user updates after
        notes=data.get("notes", ""),
        created_by=current_user.id,
        status="draft",
        **totals,
    )
    db.add(invoice)
    for li in line_items:
        db.add(li)
    await db.commit()
    return {"success": True, "data": {"invoice_id": str(inv_id), "invoice_number": inv_no, "status": "draft"}}


@router.post("/{document_id}/create-expense", response_model=dict)
async def create_expense_from_extraction(
    document_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ExtractedDocument).where(ExtractedDocument.document_id == document_id)
    )
    ext = result.scalar_one_or_none()
    if not ext or not ext.extracted_data:
        raise HTTPException(status_code=400, detail="No extraction data available")

    data = ext.extracted_data
    from decimal import Decimal as D
    from datetime import date

    exp = Expense(
        id=uuid.uuid4(),
        organization_id=current_user.organization_id,
        expense_date=date.today(),
        description=data.get("notes", "Extracted expense"),
        amount=D(str(data.get("total_amount", 0))),
        gst_amount=D(str(data.get("gst_amount", 0))),
        created_by=current_user.id,
    )
    db.add(exp)
    await db.commit()
    return {"success": True, "data": {"expense_id": str(exp.id)}}


@router.post("/{document_id}/create-vendor-bill", response_model=dict)
async def create_vendor_bill_from_extraction(
    document_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Vendor bill is modeled as an expense with a vendor link
    return await create_expense_from_extraction(document_id=document_id, current_user=current_user, db=db)
