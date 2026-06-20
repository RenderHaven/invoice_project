from decimal import Decimal


def calculate_line_totals(quantity: Decimal, unit_price: Decimal, gst_rate: Decimal) -> dict:
    """Calculate gst_amount and line_total for a single line item."""
    taxable = quantity * unit_price
    gst_amount = (taxable * gst_rate / Decimal("100")).quantize(Decimal("0.01"))
    line_total = (taxable + gst_amount).quantize(Decimal("0.01"))
    return {
        "gst_amount": gst_amount,
        "line_total": line_total,
    }


def calculate_document_totals(line_items: list) -> dict:
    """Sum subtotal, gst_amount and total_amount from a list of line item dicts."""
    subtotal = sum(
        (item["quantity"] * item["unit_price"]) for item in line_items
    )
    gst_amount = sum(item["gst_amount"] for item in line_items)
    total_amount = subtotal + gst_amount
    return {
        "subtotal": Decimal(str(subtotal)).quantize(Decimal("0.01")),
        "gst_amount": Decimal(str(gst_amount)).quantize(Decimal("0.01")),
        "total_amount": Decimal(str(total_amount)).quantize(Decimal("0.01")),
    }
