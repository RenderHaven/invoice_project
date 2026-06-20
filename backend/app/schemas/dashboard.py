from pydantic import BaseModel
from typing import Optional, List
from decimal import Decimal


class KPICard(BaseModel):
    title: str
    value: Decimal
    currency: str = "INR"


class DashboardSummary(BaseModel):
    total_revenue: Decimal
    total_expenses: Decimal
    net_profit: Decimal
    total_receivables: Decimal
    total_payables: Decimal
    gst_collected: Decimal
    gst_paid: Decimal
    net_gst_liability: Decimal


class ReceivableItem(BaseModel):
    customer_id: str
    business_name: str
    total_invoiced: Decimal
    total_paid: Decimal
    outstanding: Decimal


class PayableItem(BaseModel):
    vendor_id: str
    business_name: str
    total_expenses: Decimal


class RevenueTrendItem(BaseModel):
    period: str
    revenue: Decimal
    expenses: Decimal


class InvoiceStatusSummary(BaseModel):
    draft: int
    sent: int
    paid: int
    overdue: int
    cancelled: int


class TopCustomer(BaseModel):
    customer_id: str
    business_name: str
    total_revenue: Decimal


class TopVendor(BaseModel):
    vendor_id: str
    business_name: str
    total_expenses: Decimal


class RecentActivity(BaseModel):
    type: str
    id: str
    description: str
    amount: Optional[Decimal] = None
    date: str


class GSTSummary(BaseModel):
    period: str
    gst_collected: Decimal
    gst_paid: Decimal
    net_liability: Decimal
