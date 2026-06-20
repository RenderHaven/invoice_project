# API Contract

# Finance, Accounting & Billing Platform API

Version: 2.0

---

# Overview

This document defines the API contract for the Finance, Accounting & Billing Platform.

The API supports:

* Authentication & User Management
* Organization Management
* Customer Management
* Vendor Management
* Address Management
* Bank Account Management
* Product & Service Management
* Category Management
* Quotation Management
* Invoice Management
* Payment Tracking
* Expense Management
* Dashboard & Analytics
* GST Reporting
* AI Document Extraction

---

# Base URL

```http
/api/v1
```

---

# Authentication

All endpoints require authentication unless specified otherwise.

```http
Authorization: Bearer <token>
```

---

# Common Query Parameters

All list endpoints should support:

| Parameter | Type    | Description      |
| --------- | ------- | ---------------- |
| page      | integer | Page number      |
| limit     | integer | Records per page |
| search    | string  | Search keyword   |
| sort      | string  | Sort field       |
| order     | string  | asc / desc       |

Example:

```http
GET /customers?page=1&limit=20&search=abc&sort=created_at&order=desc
```

---

# Standard Response Format

## Success

```json
{
  "success": true,
  "data": {}
}
```

## Error

```json
{
  "success": false,
  "message": "Error message"
}
```

---

# User Roles

Three roles exist in the system. All data is scoped to the user's organization.

| Role      | Description |
| --------- | ----------- |
| `admin`   | Full system access including user management and company profile edit/delete |
| `manager` | Full operational access (invoices, quotations, customers, expenses, etc.). Can **view** company details and users but **cannot** edit/delete company profile or manage users |
| `other`   | Read-only access to all modules. Cannot create, edit, or delete anything |

### Auto-created Admin

When an organization is registered via `POST /auth/register`, a default **admin** user is automatically created using the organization email and a temporary password of `Test@1234`. The admin should change this password after first login.

---

# Authentication

## Register Organization

```http
POST /auth/register
```

Creates a new organization and an admin user in one step.

### Request

```json
{
  "org_name": "My Business Pvt Ltd",
  "name": "Vikram",
  "email": "vikram@mybusiness.com",
  "password": "Test@1234"
}
```

### Response

```json
{
  "success": true,
  "data": {
    "token": "jwt-token",
    "user": {}
  }
}
```

---

## Login

```http
POST /auth/login
```

### Request

```json
{
  "email": "admin@example.com",
  "password": "Test@1234"
}
```

### Response

```json
{
  "success": true,
  "data": {
    "token": "jwt-token",
    "user": {}
  }
}
```

---

## Get Current User

```http
GET /auth/me
```

---

## Change Password

Available to **all authenticated users** to change their own password.

```http
PUT /auth/change-password
```

### Request

```json
{
  "current_password": "Test@1234",
  "new_password": "MyNewSecure@2024"
}
```

---

# User Management

All endpoints in this section require **admin** role.

## List Users

```http
GET /users
```

Returns all users in the current organization.

---

## Get User

```http
GET /users/{id}
```

---

## Create User

```http
POST /users
```

### Request

```json
{
  "name": "Riya Sharma",
  "email": "riya@mybusiness.com",
  "password": "Test@1234",
  "role": "manager"
}
```

---

## Delete User

```http
DELETE /users/{id}
```

Admin cannot delete themselves.

---

## Reset User Password (Admin)

Admin can reset any user's password directly.

```http
PUT /users/{id}/reset-password
```

### Request

```json
{
  "new_password": "NewTemp@1234"
}
```

---

# Organization Management

## Get Organization

```http
GET /organization
```

## Update Organization

```http
PUT /organization
```

---

# Address Management

## List Addresses

```http
GET /addresses
```

## Get Address

```http
GET /addresses/{id}
```

## Create Address

```http
POST /addresses
```

## Update Address

```http
PUT /addresses/{id}
```

## Delete Address

```http
DELETE /addresses/{id}
```

---

# Bank Account Management

## List Bank Accounts

```http
GET /bank-accounts
```

## Get Bank Account

```http
GET /bank-accounts/{id}
```

## Create Bank Account

```http
POST /bank-accounts
```

## Update Bank Account

```http
PUT /bank-accounts/{id}
```

## Delete Bank Account

```http
DELETE /bank-accounts/{id}
```

---

# Customer Management

## List Customers

```http
GET /customers
```

### Filters

```http
?search=
```

---

## Get Customer

```http
GET /customers/{id}
```

---

## Create Customer

```http
POST /customers
```

---

## Update Customer

```http
PUT /customers/{id}
```

---

## Delete Customer

```http
DELETE /customers/{id}
```

---

# Vendor Management

## List Vendors

```http
GET /vendors
```

### Filters

```http
?search=
```

---

## Get Vendor

```http
GET /vendors/{id}
```

---

## Create Vendor

```http
POST /vendors
```

---

## Update Vendor

```http
PUT /vendors/{id}
```

---

## Delete Vendor

```http
DELETE /vendors/{id}
```

---

# Category Management

## List Categories

```http
GET /categories
```

## Create Category

```http
POST /categories
```

## Update Category

```http
PUT /categories/{id}
```

## Delete Category

```http
DELETE /categories/{id}
```

---

# Product & Service Management

## List Items

```http
GET /items
```

### Filters

```http
?type=product
?type=service
?search=
```

---

## Get Item

```http
GET /items/{id}
```

---

## Create Item

```http
POST /items
```

---

## Update Item

```http
PUT /items/{id}
```

---

## Delete Item

```http
DELETE /items/{id}
```

---

# Quotation Management

## List Quotations

```http
GET /quotations
```

### Filters

```http
?status=
```

---

## Get Quotation

```http
GET /quotations/{id}
```

---

## Create Quotation

```http
POST /quotations
```

---

## Update Quotation

```http
PUT /quotations/{id}
```

---

## Delete Quotation

```http
DELETE /quotations/{id}
```

---

## Accept Quotation

```http
POST /quotations/{id}/accept
```

---

## Reject Quotation

```http
POST /quotations/{id}/reject
```

---

## Convert To Invoice

```http
POST /quotations/{id}/convert
```

---

## Generate PDF

```http
GET /quotations/{id}/pdf
```

---

# Invoice Management

## List Invoices

```http
GET /invoices
```

### Filters

```http
?status=
```

---

## Get Invoice

```http
GET /invoices/{id}
```

---

## Create Invoice

```http
POST /invoices
```

---

## Update Invoice

```http
PUT /invoices/{id}
```

---

## Mark Sent

```http
POST /invoices/{id}/mark-sent
```

---

## Mark Paid

```http
POST /invoices/{id}/mark-paid
```

---

## Cancel Invoice

```http
POST /invoices/{id}/cancel
```

---

## Generate PDF

```http
GET /invoices/{id}/pdf
```

---

# Payment Management

## List Payments

```http
GET /payments
```

---

## Get Payment

```http
GET /payments/{id}
```

---

## Record Payment

```http
POST /payments
```

---

## Delete Payment

```http
DELETE /payments/{id}
```

---

# Expense Management

## List Expenses

```http
GET /expenses
```

---

## Get Expense

```http
GET /expenses/{id}
```

---

## Create Expense

```http
POST /expenses
```

---

## Update Expense

```http
PUT /expenses/{id}
```

---

## Delete Expense

```http
DELETE /expenses/{id}
```

---

## Upload Expense Attachment

```http
POST /expenses/{id}/attachments
```

---

## List Expense Attachments

```http
GET /expenses/{id}/attachments
```

---

# Dashboard APIs

## Dashboard Summary

```http
GET /dashboard
```

Returns:

* Revenue
* Expenses
* Profit
* Receivables
* Payables
* GST Summary
* KPI Cards

---

## Financial Overview

```http
GET /dashboard/overview
```

---

## Receivables

```http
GET /dashboard/receivables
```

---

## Payables

```http
GET /dashboard/payables
```

---

## GST Summary

```http
GET /dashboard/gst
```

---

## Revenue Trend

```http
GET /dashboard/revenue-trend
```

Query Parameters:

```text
period=monthly
period=quarterly
period=yearly
```

---

## Expense Trend

```http
GET /dashboard/expense-trend
```

---

## Invoice Status Summary

```http
GET /dashboard/invoice-status
```

---

## Top Customers

```http
GET /dashboard/top-customers
```

---

## Top Vendors

```http
GET /dashboard/top-vendors
```

---

## Recent Activities

```http
GET /dashboard/recent-activities
```

---

# GST APIs

## GST Summary

```http
GET /gst/summary
```

---

# AI Document Extraction

## Upload Document

```http
POST /documents/upload
```

Content Type:

```http
multipart/form-data
```

Supported Files:

* PDF
* JPG
* PNG

---

## List Documents

```http
GET /documents
```

---

## Get Document

```http
GET /documents/{id}
```

---

## Extract Document

```http
POST /documents/{id}/extract
```

---

## Reprocess Extraction

```http
POST /documents/{id}/reprocess
```

---

## Get Extraction Result

```http
GET /documents/{id}/extraction
```

---

## Create Invoice From Extraction

```http
POST /documents/{id}/create-invoice
```

---

## Create Expense From Extraction

```http
POST /documents/{id}/create-expense
```

---

## Create Vendor Bill From Extraction

```http
POST /documents/{id}/create-vendor-bill
```

---

# Status Values

## Quotation Status

```text
draft
sent
accepted
rejected
```

## Invoice Status

```text
draft
sent
paid
overdue
cancelled
```

## Document Status

```text
uploaded
processing
completed
failed
```

---

# Future Enhancements (Out of Scope)

The following APIs are intentionally excluded from MVP:

* Purchase Orders
* Inventory Management
* Full Accounting Ledger
* Journal Entries
* Payroll
* Banking Integrations
* Notifications
* Audit Logs
* AI Forecasting
* AI Financial Insights
* Advanced Reporting

These modules may be introduced in future versions without major architectural changes.
