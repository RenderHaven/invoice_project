from pathlib import Path

from weasyprint import HTML
from jinja2 import Environment, FileSystemLoader, select_autoescape
from fastapi.responses import StreamingResponse
import io


# Templates live in app/templates. The invoice/quotation PDF is rendered from
# invoice_template.html, filled with dynamic data, then converted to a PDF.
TEMPLATE_DIR = Path(__file__).resolve().parent.parent / "templates"
INVOICE_TEMPLATE_NAME = "invoice_template.html"

BRAND_NAME = "RenderHaven"
CURRENCY_SYMBOL = "₹"  # ₹

_env = Environment(
    loader=FileSystemLoader(str(TEMPLATE_DIR)),
    autoescape=select_autoescape(["html", "xml"]),
)


def render_invoice_html(data: dict) -> str:
    """Fill the HTML template with dynamic invoice/quotation data."""
    template = _env.get_template(INVOICE_TEMPLATE_NAME)
    context = {
        "brand": BRAND_NAME,
        "currency": CURRENCY_SYMBOL,
        "doc_type": data.get("doc_type", "INVOICE"),
        "doc_number": data.get("doc_number", ""),
        "doc_date": data.get("doc_date", ""),
        "due_date": data.get("due_date", ""),
        "org_name": data.get("org_name", ""),
        "org_gst": data.get("org_gst", ""),
        "org_email": data.get("org_email", ""),
        "org_phone": data.get("org_phone", ""),
        "customer_name": data.get("customer_name", ""),
        "customer_gst": data.get("customer_gst", ""),
        "customer_email": data.get("customer_email", ""),
        "customer_phone": data.get("customer_phone", ""),
        "notes": data.get("notes", ""),
        "subtotal": data.get("subtotal", "0.00"),
        "gst_amount": data.get("gst_amount", "0.00"),
        "total_amount": data.get("total_amount", "0.00"),
        "line_items": data.get("line_items", []),
    }
    return template.render(**context)


def generate_pdf(data: dict) -> bytes:
    """Render the HTML template for an invoice or quotation and return PDF bytes."""
    html_content = render_invoice_html(data)
    return HTML(string=html_content).write_pdf()


def pdf_streaming_response(pdf_bytes: bytes, filename: str) -> StreamingResponse:
    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
