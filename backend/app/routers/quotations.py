import uuid
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.dependencies import get_current_user, require_admin_or_manager
from app.models.user import User
from app.models.organization import Organization
from app.models.quotation import Quotation, QuotationItem
from app.models.invoice import Invoice, InvoiceItem
from app.models.party import Party
from app.schemas.quotation import QuotationCreate, QuotationUpdate, QuotationResponse
from app.utils.number_generator import generate_quotation_number, generate_invoice_number
from app.utils.gst_calculator import calculate_line_totals, calculate_document_totals
from app.services.pdf_service import generate_pdf, pdf_streaming_response

router = APIRouter(prefix="/quotations", tags=["Quotations"])


def _q_base(org_id):
    return (
        select(Quotation)
        .where(Quotation.organization_id == org_id)
        .options(selectinload(Quotation.line_items))
    )


def _build_line_items(quotation_id, items_data):
    line_items = []
    for li in items_data:
        totals = calculate_line_totals(li.quantity, li.unit_price, li.gst_rate)
        line_items.append(QuotationItem(
            id=uuid.uuid4(),
            quotation_id=quotation_id,
            item_id=li.item_id,
            description=li.description,
            quantity=li.quantity,
            unit_price=li.unit_price,
            gst_rate=li.gst_rate,
            **totals,
        ))
    return line_items


@router.get("", response_model=dict)
async def list_quotations(
    status: str = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    q = _q_base(current_user.organization_id)
    if status:
        q = q.where(Quotation.status == status)
    result = await db.execute(q.offset((page - 1) * limit).limit(limit))
    items = result.scalars().all()
    return {"success": True, "data": [QuotationResponse.model_validate(i).model_dump() for i in items]}


@router.get("/{quotation_id}", response_model=dict)
async def get_quotation(
    quotation_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(_q_base(current_user.organization_id).where(Quotation.id == quotation_id))
    q = result.scalar_one_or_none()
    if not q:
        raise HTTPException(status_code=404, detail="Quotation not found")
    return {"success": True, "data": QuotationResponse.model_validate(q).model_dump()}


@router.post("", response_model=dict, status_code=201)
async def create_quotation(
    payload: QuotationCreate,
    current_user: User = Depends(require_admin_or_manager),
    db: AsyncSession = Depends(get_db),
):
    org_result = await db.execute(select(Organization).where(Organization.id == current_user.organization_id))
    org = org_result.scalar_one()
    prefix = org.quotation_prefix or "QUO"
    qno = await generate_quotation_number(db, current_user.organization_id, prefix)

    qid = uuid.uuid4()
    line_items = _build_line_items(qid, payload.line_items)
    li_dicts = [{"quantity": li.quantity, "unit_price": li.unit_price, "gst_amount": li.gst_amount} for li in line_items]
    totals = calculate_document_totals(li_dicts)

    quotation = Quotation(
        id=qid,
        organization_id=current_user.organization_id,
        quotation_number=qno,
        customer_id=payload.customer_id,
        quotation_date=payload.quotation_date,
        valid_until=payload.valid_until,
        notes=payload.notes,
        created_by=current_user.id,
        **totals,
    )
    db.add(quotation)
    for li in line_items:
        db.add(li)
    await db.commit()
    res = await db.execute(_q_base(current_user.organization_id).where(Quotation.id == qid))
    return {"success": True, "data": QuotationResponse.model_validate(res.scalar_one()).model_dump()}


@router.put("/{quotation_id}", response_model=dict)
async def update_quotation(
    quotation_id: uuid.UUID,
    payload: QuotationUpdate,
    current_user: User = Depends(require_admin_or_manager),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Quotation).where(Quotation.id == quotation_id, Quotation.organization_id == current_user.organization_id)
        .options(selectinload(Quotation.line_items))
    )
    quotation = result.scalar_one_or_none()
    if not quotation:
        raise HTTPException(status_code=404, detail="Quotation not found")

    for field, value in payload.model_dump(exclude_unset=True, exclude={"line_items"}).items():
        setattr(quotation, field, value)

    if payload.line_items is not None:
        for li in quotation.line_items:
            await db.delete(li)
        await db.flush()
        new_items = _build_line_items(quotation_id, payload.line_items)
        li_dicts = [{"quantity": li.quantity, "unit_price": li.unit_price, "gst_amount": li.gst_amount} for li in new_items]
        totals = calculate_document_totals(li_dicts)
        for field, value in totals.items():
            setattr(quotation, field, value)
        for li in new_items:
            db.add(li)

    await db.commit()
    res = await db.execute(_q_base(current_user.organization_id).where(Quotation.id == quotation_id))
    return {"success": True, "data": QuotationResponse.model_validate(res.scalar_one()).model_dump()}


@router.delete("/{quotation_id}", response_model=dict)
async def delete_quotation(
    quotation_id: uuid.UUID,
    current_user: User = Depends(require_admin_or_manager),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Quotation).where(Quotation.id == quotation_id, Quotation.organization_id == current_user.organization_id)
    )
    q = result.scalar_one_or_none()
    if not q:
        raise HTTPException(status_code=404, detail="Quotation not found")
    await db.delete(q)
    await db.commit()
    return {"success": True, "data": None}


@router.post("/{quotation_id}/accept", response_model=dict)
async def accept_quotation(
    quotation_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Quotation).where(Quotation.id == quotation_id, Quotation.organization_id == current_user.organization_id)
    )
    q = result.scalar_one_or_none()
    if not q:
        raise HTTPException(status_code=404, detail="Quotation not found")
    q.status = "accepted"
    await db.commit()
    return {"success": True, "data": {"status": "accepted"}}


@router.post("/{quotation_id}/reject", response_model=dict)
async def reject_quotation(
    quotation_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Quotation).where(Quotation.id == quotation_id, Quotation.organization_id == current_user.organization_id)
        .options(selectinload(Quotation.line_items))
    )
    q = result.scalar_one_or_none()
    if not q:
        raise HTTPException(status_code=404, detail="Quotation not found")
    q.status = "rejected"
    await db.commit()
    return {"success": True, "data": {"status": "rejected"}}


@router.post("/{quotation_id}/convert", response_model=dict)
async def convert_to_invoice(
    quotation_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Quotation).where(Quotation.id == quotation_id, Quotation.organization_id == current_user.organization_id)
        .options(selectinload(Quotation.line_items))
    )
    q = result.scalar_one_or_none()
    if not q:
        raise HTTPException(status_code=404, detail="Quotation not found")

    org_result = await db.execute(select(Organization).where(Organization.id == current_user.organization_id))
    org = org_result.scalar_one()
    inv_no = await generate_invoice_number(db, current_user.organization_id, org.invoice_prefix or "INV")

    inv_id = uuid.uuid4()
    invoice = Invoice(
        id=inv_id,
        organization_id=current_user.organization_id,
        invoice_number=inv_no,
        customer_id=q.customer_id,
        quotation_id=q.id,
        invoice_date=q.quotation_date,
        notes=q.notes,
        subtotal=q.subtotal,
        gst_amount=q.gst_amount,
        total_amount=q.total_amount,
        created_by=current_user.id,
    )
    db.add(invoice)
    for li in q.line_items:
        db.add(InvoiceItem(
            id=uuid.uuid4(),
            invoice_id=inv_id,
            item_id=li.item_id,
            description=li.description,
            quantity=li.quantity,
            unit_price=li.unit_price,
            gst_rate=li.gst_rate,
            gst_amount=li.gst_amount,
            line_total=li.line_total,
        ))
    q.status = "accepted"
    await db.commit()
    return {"success": True, "data": {"invoice_id": str(inv_id), "invoice_number": inv_no}}


@router.get("/{quotation_id}/pdf")
async def quotation_pdf(
    quotation_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    from sqlalchemy.orm import selectinload
    result = await db.execute(
        select(Quotation).where(Quotation.id == quotation_id, Quotation.organization_id == current_user.organization_id)
        .options(selectinload(Quotation.line_items), selectinload(Quotation.customer), selectinload(Quotation.organization))
    )
    q = result.scalar_one_or_none()
    if not q:
        raise HTTPException(status_code=404, detail="Quotation not found")

    data = {
        "doc_type": "QUOTATION",
        "doc_number": q.quotation_number,
        "doc_date": str(q.quotation_date or ""),
        "org_name": q.organization.name if q.organization else "",
        "org_gst": q.organization.gst_number or "",
        "org_email": q.organization.email or "",
        "org_phone": q.organization.phone or "",
        "customer_name": q.customer.business_name if q.customer else "",
        "customer_gst": q.customer.gst_number or "" if q.customer else "",
        "customer_email": q.customer.email or "" if q.customer else "",
        "customer_phone": q.customer.phone or "" if q.customer else "",
        "notes": q.notes or "",
        "subtotal": str(q.subtotal),
        "gst_amount": str(q.gst_amount),
        "total_amount": str(q.total_amount),
        "line_items": [
            {
                "description": li.description or "",
                "quantity": str(li.quantity),
                "unit_price": str(li.unit_price),
                "gst_rate": str(li.gst_rate),
                "gst_amount": str(li.gst_amount),
                "line_total": str(li.line_total),
            }
            for li in q.line_items
        ],
    }
    pdf_bytes = generate_pdf(data)
    return pdf_streaming_response(pdf_bytes, f"quotation_{q.quotation_number}.pdf")
