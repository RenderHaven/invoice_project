import uuid
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.dependencies import get_current_user, require_admin_or_manager
from app.models.user import User
from app.models.organization import Organization
from app.models.invoice import Invoice, InvoiceItem
from app.schemas.invoice import InvoiceCreate, InvoiceUpdate, InvoiceResponse
from app.utils.number_generator import generate_invoice_number
from app.utils.gst_calculator import calculate_line_totals, calculate_document_totals
from app.services.pdf_service import generate_pdf, pdf_streaming_response

router = APIRouter(prefix="/invoices", tags=["Invoices"])


def _inv_base(org_id):
    return (
        select(Invoice)
        .where(Invoice.organization_id == org_id)
        .options(selectinload(Invoice.line_items))
    )


def _build_line_items(invoice_id, items_data):
    line_items = []
    for li in items_data:
        totals = calculate_line_totals(li.quantity, li.unit_price, li.gst_rate)
        line_items.append(InvoiceItem(
            id=uuid.uuid4(),
            invoice_id=invoice_id,
            item_id=li.item_id,
            description=li.description,
            quantity=li.quantity,
            unit_price=li.unit_price,
            gst_rate=li.gst_rate,
            **totals,
        ))
    return line_items


@router.get("", response_model=dict)
async def list_invoices(
    status: str = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    q = _inv_base(current_user.organization_id)
    if status:
        q = q.where(Invoice.status == status)
    result = await db.execute(q.offset((page - 1) * limit).limit(limit))
    items = result.scalars().all()
    return {"success": True, "data": [InvoiceResponse.model_validate(i).model_dump() for i in items]}


@router.get("/{invoice_id}", response_model=dict)
async def get_invoice(
    invoice_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(_inv_base(current_user.organization_id).where(Invoice.id == invoice_id))
    inv = result.scalar_one_or_none()
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return {"success": True, "data": InvoiceResponse.model_validate(inv).model_dump()}


@router.post("", response_model=dict, status_code=201)
async def create_invoice(
    payload: InvoiceCreate,
    current_user: User = Depends(require_admin_or_manager),
    db: AsyncSession = Depends(get_db),
):
    org_result = await db.execute(select(Organization).where(Organization.id == current_user.organization_id))
    org = org_result.scalar_one()
    inv_no = await generate_invoice_number(db, current_user.organization_id, org.invoice_prefix or "INV")

    inv_id = uuid.uuid4()
    line_items = _build_line_items(inv_id, payload.line_items)
    li_dicts = [{"quantity": li.quantity, "unit_price": li.unit_price, "gst_amount": li.gst_amount} for li in line_items]
    totals = calculate_document_totals(li_dicts)

    invoice = Invoice(
        id=inv_id,
        organization_id=current_user.organization_id,
        invoice_number=inv_no,
        customer_id=payload.customer_id,
        quotation_id=payload.quotation_id,
        invoice_date=payload.invoice_date,
        due_date=payload.due_date,
        notes=payload.notes,
        created_by=current_user.id,
        **totals,
    )
    db.add(invoice)
    for li in line_items:
        db.add(li)
    await db.commit()
    res = await db.execute(_inv_base(current_user.organization_id).where(Invoice.id == inv_id))
    return {"success": True, "data": InvoiceResponse.model_validate(res.scalar_one()).model_dump()}


@router.put("/{invoice_id}", response_model=dict)
async def update_invoice(
    invoice_id: uuid.UUID,
    payload: InvoiceUpdate,
    current_user: User = Depends(require_admin_or_manager),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Invoice).where(Invoice.id == invoice_id, Invoice.organization_id == current_user.organization_id)
        .options(selectinload(Invoice.line_items))
    )
    invoice = result.scalar_one_or_none()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    for field, value in payload.model_dump(exclude_unset=True, exclude={"line_items"}).items():
        setattr(invoice, field, value)

    if payload.line_items is not None:
        for li in invoice.line_items:
            await db.delete(li)
        await db.flush()
        new_items = _build_line_items(invoice_id, payload.line_items)
        li_dicts = [{"quantity": li.quantity, "unit_price": li.unit_price, "gst_amount": li.gst_amount} for li in new_items]
        totals = calculate_document_totals(li_dicts)
        for field, value in totals.items():
            setattr(invoice, field, value)
        for li in new_items:
            db.add(li)

    await db.commit()
    res = await db.execute(_inv_base(current_user.organization_id).where(Invoice.id == invoice_id))
    return {"success": True, "data": InvoiceResponse.model_validate(res.scalar_one()).model_dump()}


@router.post("/{invoice_id}/mark-sent", response_model=dict)
async def mark_sent(
    invoice_id: uuid.UUID,
    current_user: User = Depends(require_admin_or_manager),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Invoice).where(Invoice.id == invoice_id, Invoice.organization_id == current_user.organization_id)
    )
    inv = result.scalar_one_or_none()
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")
    inv.status = "sent"
    await db.commit()
    return {"success": True, "data": {"status": "sent"}}


@router.post("/{invoice_id}/mark-paid", response_model=dict)
async def mark_paid(
    invoice_id: uuid.UUID,
    current_user: User = Depends(require_admin_or_manager),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Invoice).where(Invoice.id == invoice_id, Invoice.organization_id == current_user.organization_id)
    )
    inv = result.scalar_one_or_none()
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")
    inv.status = "paid"
    await db.commit()
    return {"success": True, "data": {"status": "paid"}}


@router.post("/{invoice_id}/cancel", response_model=dict)
async def cancel_invoice(
    invoice_id: uuid.UUID,
    current_user: User = Depends(require_admin_or_manager),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Invoice).where(Invoice.id == invoice_id, Invoice.organization_id == current_user.organization_id)
    )
    inv = result.scalar_one_or_none()
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")
    inv.status = "cancelled"
    await db.commit()
    return {"success": True, "data": {"status": "cancelled"}}


@router.get("/{invoice_id}/pdf")
async def invoice_pdf(
    invoice_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Invoice).where(Invoice.id == invoice_id, Invoice.organization_id == current_user.organization_id)
        .options(selectinload(Invoice.line_items), selectinload(Invoice.customer), selectinload(Invoice.organization))
    )
    inv = result.scalar_one_or_none()
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")

    data = {
        "doc_type": "INVOICE",
        "doc_number": inv.invoice_number,
        "doc_date": str(inv.invoice_date or ""),
        "due_date": str(inv.due_date or ""),
        "org_name": inv.organization.name if inv.organization else "",
        "org_gst": inv.organization.gst_number or "",
        "org_email": inv.organization.email or "",
        "org_phone": inv.organization.phone or "",
        "customer_name": inv.customer.business_name if inv.customer else "",
        "customer_gst": inv.customer.gst_number or "" if inv.customer else "",
        "customer_email": inv.customer.email or "" if inv.customer else "",
        "customer_phone": inv.customer.phone or "" if inv.customer else "",
        "notes": inv.notes or "",
        "subtotal": str(inv.subtotal),
        "gst_amount": str(inv.gst_amount),
        "total_amount": str(inv.total_amount),
        "line_items": [
            {
                "description": li.description or "",
                "quantity": str(li.quantity),
                "unit_price": str(li.unit_price),
                "gst_rate": str(li.gst_rate),
                "gst_amount": str(li.gst_amount),
                "line_total": str(li.line_total),
            }
            for li in inv.line_items
        ],
    }
    pdf_bytes = generate_pdf(data)
    return pdf_streaming_response(pdf_bytes, f"invoice_{inv.invoice_number}.pdf")
