# Frontend Functional Specification (FSD)

# Finance, Accounting & Billing Platform

Version: 1.0

---

# 1. Overview

This document defines the frontend structure, navigation, screens, user interactions, and functional behavior of the Finance, Accounting & Billing Platform.

The frontend should provide a simple business-oriented experience focused on:

* Customer Management
* Vendor Management
* Products & Services
* Quotations
* Invoices
* Payments
* Expenses
* GST Overview
* Dashboard Analytics
* AI Document Extraction

---

# 2. Application Layout

## Desktop Layout

```text
┌───────────────────────────────────────────┐
│ Header                                    │
├─────────────┬─────────────────────────────┤
│ Sidebar     │ Main Content Area           │
│ Navigation  │                             │
│             │                             │
└─────────────┴─────────────────────────────┘
```

---

# 3. Navigation Structure

```text
Dashboard

Customers
Vendors

Products & Services
Categories

Quotations
Invoices
Payments

Expenses

GST

Documents

Settings
```

---

# 4. Global Components

## Sidebar

Purpose:

* Primary navigation

Items:

```text
Dashboard

Customers
Vendors

Items
Categories

Quotations
Invoices
Payments

Expenses

GST

Documents

Settings
```

---

## Top Navigation Bar

Contains:

* Organization Name
* Search Bar
* User Profile
* Logout Button

---

## Global Search

Search across:

* Customers
* Vendors
* Items
* Quotations
* Invoices

---

## Pagination Component

Reusable table pagination.

Features:

* Previous Page
* Next Page
* Page Number
* Page Size Selector

---

## Status Badge

Reusable status display.

Examples:

```text
Draft
Sent
Accepted
Rejected

Paid
Overdue
Cancelled

Processing
Completed
Failed
```

---

# 5. Dashboard Module

Route:

```text
/dashboard
```

Purpose:

Business overview.

---

## KPI Cards

Display:

```text
Revenue

Expenses

Profit

Outstanding Receivables

Outstanding Payables

GST Liability

Invoices This Month

Payments This Month

Active Customers

Active Vendors
```

---

## Revenue Trend Chart

Displays:

```text
Monthly Revenue
Quarterly Revenue
Yearly Revenue
```

API:

```http
GET /dashboard/revenue-trend
```

---

## Expense Trend Chart

API:

```http
GET /dashboard/expense-trend
```

---

## Invoice Status Widget

Displays:

```text
Draft
Sent
Paid
Overdue
Cancelled
```

API:

```http
GET /dashboard/invoice-status
```

---

## Top Customers Widget

API:

```http
GET /dashboard/top-customers
```

---

## Top Vendors Widget

API:

```http
GET /dashboard/top-vendors
```

---

# 6. Customer Module

Route:

```text
/customers
```

---

## Customer List Page

Features:

* Search
* Pagination
* Sorting
* View Customer
* Edit Customer
* Delete Customer

API:

```http
GET /customers
```

---

## Customer Details Page

Route:

```text
/customers/:id
```

Sections:

### Profile

* Business Name
* Contact Person
* GST Number
* Contact Details

### Addresses

### Bank Accounts

### Recent Invoices

### Outstanding Amount

---

## Customer Form

Fields:

```text
Business Name
Contact Person

GST Number

Email
Phone

Address

Bank Details
```

---

# 7. Vendor Module

Route:

```text
/vendors
```

Functionality mirrors Customer Module.

---

# 8. Products & Services Module

Route:

```text
/items
```

---

## Item List

Filters:

```text
All
Products
Services
```

Features:

* Search
* Category Filter
* Pagination

---

## Item Form

Fields:

```text
Name

Type
(Product / Service)

Category

Unit

Sale Price

GST Rate

Description
```

---

# 9. Category Module

Route:

```text
/categories
```

Features:

* List Categories
* Create Category
* Update Category
* Delete Category

---

# 10. Quotation Module

Route:

```text
/quotations
```

---

## Quotation List

Features:

* Search
* Status Filter
* Date Filter

Statuses:

```text
Draft
Sent
Accepted
Rejected
```

---

## Create Quotation

Fields:

### Customer

Customer Selection

### Items

Dynamic Item Table

Columns:

```text
Item
Description
Quantity
Unit Price
GST
Amount
```

---

## Summary Section

Displays:

```text
Subtotal

GST

Grand Total
```

---

## Actions

```text
Save Draft

Send

Generate PDF

Accept

Reject

Convert To Invoice
```

---

# 11. Invoice Module

Route:

```text
/invoices
```

---

## Invoice List

Filters:

```text
Status
Date Range
Customer
```

---

## Invoice Form

Fields:

```text
Customer

Invoice Date

Due Date

Items
```

---

## Invoice Actions

```text
Save

Mark Sent

Mark Paid

Cancel

Generate PDF
```

---

## Invoice Status

```text
Draft
Sent
Paid
Overdue
Cancelled
```

---

# 12. Payment Module

Route:

```text
/payments
```

---

## Payment List

Features:

* Search
* Pagination
* Date Filter

---

## Record Payment Form

Fields:

```text
Invoice

Customer

Amount

Payment Method

Reference Number

Notes
```

---

## Payment Methods

```text
Cash
UPI
Bank Transfer
Card
Cheque
```

---

# 13. Expense Module

Route:

```text
/expenses
```

---

## Expense List

Features:

* Search
* Vendor Filter
* Category Filter
* Date Filter

---

## Expense Form

Fields:

```text
Vendor

Category

Date

Amount

GST Amount

Description
```

---

## Receipt Upload

Features:

* Drag & Drop
* File Upload
* Preview

Supported:

```text
PDF
PNG
JPG
```

---

# 14. GST Module

Route:

```text
/gst
```

Purpose:

GST reporting and summary.

---

## GST Cards

Display:

```text
GST Collected

GST Paid

Net GST Liability
```

---

## GST Report Table

Columns:

```text
Month

GST Collected

GST Paid

Liability
```

---

# 15. AI Document Extraction Module

Route:

```text
/documents
```

---

## Document List

Columns:

```text
File Name

Type

Status

Upload Date
```

Statuses:

```text
Uploaded
Processing
Completed
Failed
```

---

## Upload Document

Features:

* Drag & Drop
* File Upload
* Preview

Supported Files:

```text
PDF

PNG

JPG
```

---

## Extraction Result Page

Displays:

### Extracted Vendor / Customer

### Extracted Items

### GST Details

### Total Amount

### Confidence Score

---

## Actions

```text
Reprocess

Create Invoice

Create Expense

Create Vendor Bill
```

---

# 16. Settings Module

Route:

```text
/settings
```

---

## Organization Settings

Fields:

```text
Organization Name

GST Number

Address

Email

Phone
```

---

## Invoice Settings

Fields:

```text
Invoice Prefix

Quotation Prefix

Invoice Notes

Terms & Conditions
```

---

## Bank Accounts

Manage:

```text
Bank Name

Account Number

IFSC Code

UPI ID
```

---

# 17. Responsive Behavior

## Desktop

Full Sidebar Layout

---

## Tablet

Collapsible Sidebar

---

## Mobile

Drawer Navigation

Simplified Tables

Card-Based Views

---

# 18. Design Principles

* Business-focused UI
* Minimal clicks
* Fast data entry
* Mobile responsive
* Consistent table layouts
* Reusable forms
* Reusable status badges
* Reusable filters
* Reusable modals
* Clean financial dashboard
