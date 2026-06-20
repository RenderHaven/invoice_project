"""Initial schema

Revision ID: 001
Revises: 
Create Date: 2026-06-20
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = '001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Enable UUID extension
    op.execute('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')

    # addresses
    op.create_table(
        'addresses',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('line1', sa.String(255)),
        sa.Column('line2', sa.String(255)),
        sa.Column('city', sa.String(100)),
        sa.Column('state', sa.String(100)),
        sa.Column('country', sa.String(100)),
        sa.Column('postal_code', sa.String(20)),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # bank_accounts
    op.create_table(
        'bank_accounts',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('holder_name', sa.String(255)),
        sa.Column('bank_name', sa.String(255)),
        sa.Column('account_number', sa.String(100)),
        sa.Column('ifsc_code', sa.String(20)),
        sa.Column('upi_id', sa.String(100)),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # organizations
    op.create_table(
        'organizations',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('gst_number', sa.String(20)),
        sa.Column('email', sa.String(255)),
        sa.Column('phone', sa.String(20)),
        sa.Column('address_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('addresses.id')),
        sa.Column('invoice_prefix', sa.String(10), server_default='INV'),
        sa.Column('quotation_prefix', sa.String(10), server_default='QUO'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now()),
    )

    # users
    op.create_table(
        'users',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('organization_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('organizations.id'), nullable=False),
        sa.Column('role', sa.String(50), nullable=False, server_default='staff'),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('email', sa.String(255), nullable=False, unique=True),
        sa.Column('password_hash', sa.String(255), nullable=False),
        sa.Column('is_active', sa.Boolean, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index('ix_users_email', 'users', ['email'], unique=True)

    # parties (customers + vendors)
    op.create_table(
        'parties',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('organization_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('organizations.id'), nullable=False),
        sa.Column('type', sa.String(20), nullable=False),
        sa.Column('business_name', sa.String(255), nullable=False),
        sa.Column('contact_person', sa.String(255)),
        sa.Column('gst_number', sa.String(20)),
        sa.Column('email', sa.String(255)),
        sa.Column('phone', sa.String(20)),
        sa.Column('address_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('addresses.id')),
        sa.Column('bank_account_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('bank_accounts.id')),
        sa.Column('notes', sa.Text),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # categories
    op.create_table(
        'categories',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('organization_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('organizations.id'), nullable=False),
        sa.Column('type', sa.String(20), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # items
    op.create_table(
        'items',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('organization_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('organizations.id'), nullable=False),
        sa.Column('type', sa.String(20), nullable=False),
        sa.Column('category_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('categories.id')),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('description', sa.Text),
        sa.Column('unit', sa.String(50)),
        sa.Column('sale_price', sa.Numeric(12, 2)),
        sa.Column('gst_rate', sa.Numeric(5, 2)),
        sa.Column('is_active', sa.Boolean, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # quotations
    op.create_table(
        'quotations',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('organization_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('organizations.id'), nullable=False),
        sa.Column('quotation_number', sa.String(50), nullable=False),
        sa.Column('customer_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('parties.id'), nullable=False),
        sa.Column('quotation_date', sa.Date),
        sa.Column('valid_until', sa.Date),
        sa.Column('status', sa.String(20), server_default='draft'),
        sa.Column('notes', sa.Text),
        sa.Column('subtotal', sa.Numeric(12, 2), server_default='0'),
        sa.Column('gst_amount', sa.Numeric(12, 2), server_default='0'),
        sa.Column('total_amount', sa.Numeric(12, 2), server_default='0'),
        sa.Column('created_by', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # quotation_items
    op.create_table(
        'quotation_items',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('quotation_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('quotations.id', ondelete='CASCADE'), nullable=False),
        sa.Column('item_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('items.id')),
        sa.Column('description', sa.Text),
        sa.Column('quantity', sa.Numeric(10, 3), server_default='1'),
        sa.Column('unit_price', sa.Numeric(12, 2), server_default='0'),
        sa.Column('gst_rate', sa.Numeric(5, 2), server_default='0'),
        sa.Column('gst_amount', sa.Numeric(12, 2), server_default='0'),
        sa.Column('line_total', sa.Numeric(12, 2), server_default='0'),
    )

    # invoices
    op.create_table(
        'invoices',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('organization_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('organizations.id'), nullable=False),
        sa.Column('invoice_number', sa.String(50), nullable=False),
        sa.Column('customer_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('parties.id'), nullable=False),
        sa.Column('quotation_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('quotations.id')),
        sa.Column('invoice_date', sa.Date),
        sa.Column('due_date', sa.Date),
        sa.Column('status', sa.String(20), server_default='draft'),
        sa.Column('notes', sa.Text),
        sa.Column('subtotal', sa.Numeric(12, 2), server_default='0'),
        sa.Column('gst_amount', sa.Numeric(12, 2), server_default='0'),
        sa.Column('total_amount', sa.Numeric(12, 2), server_default='0'),
        sa.Column('created_by', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # invoice_items
    op.create_table(
        'invoice_items',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('invoice_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('invoices.id', ondelete='CASCADE'), nullable=False),
        sa.Column('item_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('items.id')),
        sa.Column('description', sa.Text),
        sa.Column('quantity', sa.Numeric(10, 3), server_default='1'),
        sa.Column('unit_price', sa.Numeric(12, 2), server_default='0'),
        sa.Column('gst_rate', sa.Numeric(5, 2), server_default='0'),
        sa.Column('gst_amount', sa.Numeric(12, 2), server_default='0'),
        sa.Column('line_total', sa.Numeric(12, 2), server_default='0'),
    )

    # payments
    op.create_table(
        'payments',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('organization_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('organizations.id'), nullable=False),
        sa.Column('invoice_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('invoices.id'), nullable=False),
        sa.Column('customer_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('parties.id'), nullable=False),
        sa.Column('payment_date', sa.Date, nullable=False),
        sa.Column('amount', sa.Numeric(12, 2), nullable=False),
        sa.Column('payment_method', sa.String(50)),
        sa.Column('reference_number', sa.String(100)),
        sa.Column('notes', sa.Text),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # expenses
    op.create_table(
        'expenses',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('organization_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('organizations.id'), nullable=False),
        sa.Column('vendor_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('parties.id')),
        sa.Column('category_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('categories.id')),
        sa.Column('expense_date', sa.Date, nullable=False),
        sa.Column('description', sa.Text),
        sa.Column('amount', sa.Numeric(12, 2), nullable=False),
        sa.Column('gst_amount', sa.Numeric(12, 2), server_default='0'),
        sa.Column('payment_method', sa.String(50)),
        sa.Column('reference_number', sa.String(100)),
        sa.Column('created_by', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # expense_attachments
    op.create_table(
        'expense_attachments',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('expense_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('expenses.id', ondelete='CASCADE'), nullable=False),
        sa.Column('file_url', sa.Text, nullable=False),
        sa.Column('public_id', sa.String(255)),
        sa.Column('file_name', sa.String(255)),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # documents
    op.create_table(
        'documents',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('organization_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('organizations.id'), nullable=False),
        sa.Column('uploaded_by', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('document_type', sa.String(20), nullable=False),
        sa.Column('file_url', sa.Text, nullable=False),
        sa.Column('public_id', sa.String(255)),
        sa.Column('file_name', sa.String(255)),
        sa.Column('status', sa.String(20), server_default='uploaded'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # extracted_documents
    op.create_table(
        'extracted_documents',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('document_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('documents.id', ondelete='CASCADE'), nullable=False, unique=True),
        sa.Column('extracted_data', postgresql.JSONB),
        sa.Column('confidence_score', sa.Numeric(5, 2)),
        sa.Column('reviewed', sa.Boolean, server_default='false'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table('extracted_documents')
    op.drop_table('documents')
    op.drop_table('expense_attachments')
    op.drop_table('expenses')
    op.drop_table('payments')
    op.drop_table('invoice_items')
    op.drop_table('invoices')
    op.drop_table('quotation_items')
    op.drop_table('quotations')
    op.drop_table('items')
    op.drop_table('categories')
    op.drop_table('parties')
    op.drop_index('ix_users_email', 'users')
    op.drop_table('users')
    op.drop_table('organizations')
    op.drop_table('bank_accounts')
    op.drop_table('addresses')
