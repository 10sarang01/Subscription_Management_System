// Brightloop Systems - Data Layer
// All product, plan, subscription, invoice, payment, and discount data
// is stored exclusively in brightloop.db (SQLite) via the backend API.
// This file only contains persona definitions for role switching.

export const initialQuotationTemplates = [
  {
    id: 'tmpl-1',
    name: 'Standard SaaS Monthly Bundle',
    validityDays: 30,
    planId: 'plan-1',
    items: [
      { productId: 'prod-1', variant: 'Standard Edition', quantity: 2, unitPrice: 240 },
      { productId: 'prod-2', variant: 'Standard Capacity', quantity: 1, unitPrice: 95 }
    ]
  },
  {
    id: 'tmpl-2',
    name: 'Odoo Brand Enterprise Annual Package',
    validityDays: 15,
    planId: 'plan-2',
    items: [
      { productId: 'prod-1', variant: 'Odoo Brand Edition', quantity: 5, unitPrice: 300 }, // $240 + $60 Odoo variant
      { productId: 'prod-3', variant: '500 GB Tier', quantity: 2, unitPrice: 110 },
      { productId: 'prod-4', variant: '24/7 Global', quantity: 1, unitPrice: 500 }
    ]
  }
];

export const initialSubscriptions = [
  {
    id: 'sub-1',
    subNumber: 'SUB-2026-001',
    customerName: 'Corner Bakery & Cafe',
    customerEmail: 'alice@cornerbakery.com',
    planId: 'plan-1',
    planName: 'Monthly Professional Plan',
    billingFrequency: 'monthly',
    startDate: '2026-03-01',
    expiryDate: '2027-02-28',
    nextBillingDate: '2026-11-01',
    paymentTerms: 'Net 15',
    status: 'Active', // Draft -> Quotation -> Confirmed -> Active -> Closed (or Paused)
    items: [
      { productId: 'prod-1', name: 'Brightloop ERP Business Core', variant: 'Standard Edition', quantity: 3, unitPrice: 240, taxRate: 0.10 },
      { productId: 'prod-3', name: 'High-Performance Cloud Database Storage', variant: '100 GB Tier', quantity: 1, unitPrice: 65, taxRate: 0.10 }
    ],
    discountCode: 'SEATBOOST10',
    totalAmount: 785
  },
  {
    id: 'sub-2',
    subNumber: 'SUB-2026-002',
    customerName: 'Apex Logistics Global',
    customerEmail: 'marcus@apexlogistics.com',
    planId: 'plan-2',
    planName: 'Annual Enterprise Contract',
    billingFrequency: 'yearly',
    startDate: '2026-01-15',
    expiryDate: '2027-01-14',
    nextBillingDate: '2027-01-15',
    paymentTerms: 'Net 30',
    status: 'Active',
    items: [
      { productId: 'prod-1', name: 'Brightloop ERP Business Core', variant: 'Odoo Brand Edition', quantity: 10, unitPrice: 300, taxRate: 0.10 },
      { productId: 'prod-4', name: 'Enterprise 24/7 Priority SLA & Dedicated TAM', variant: '24/7 Global', quantity: 1, unitPrice: 500, taxRate: 0.10 }
    ],
    discountCode: 'ENTERPRISE20',
    totalAmount: 3150
  },
  {
    id: 'sub-3',
    subNumber: 'QT-2026-089',
    customerName: 'Cascade Health Networks',
    customerEmail: 'billing@cascadehealth.org',
    planId: 'plan-2',
    planName: 'Annual Enterprise Contract',
    billingFrequency: 'yearly',
    startDate: '2026-11-15',
    expiryDate: '2027-11-14',
    nextBillingDate: '2026-11-15',
    paymentTerms: 'Net 30',
    status: 'Quotation', // Moves to Confirmed -> Active
    items: [
      { productId: 'prod-1', name: 'Brightloop ERP Business Core', variant: 'Standard Edition', quantity: 8, unitPrice: 240, taxRate: 0.10 },
      { productId: 'prod-2', name: 'Advanced Analytics & AI Forecasting Add-on', variant: 'Unlimited Seats', quantity: 1, unitPrice: 145, taxRate: 0.10 }
    ],
    discountCode: '',
    totalAmount: 2065
  },
  {
    id: 'sub-4',
    subNumber: 'SUB-2026-003',
    customerName: 'Metro Urban Retailers',
    customerEmail: 'finance@metrourban.com',
    planId: 'plan-1',
    planName: 'Monthly Professional Plan',
    billingFrequency: 'monthly',
    startDate: '2026-02-01',
    expiryDate: '2026-12-31',
    nextBillingDate: '2026-10-25',
    paymentTerms: 'Due upon receipt',
    status: 'Active',
    items: [
      { productId: 'prod-1', name: 'Brightloop ERP Business Core', variant: 'Odoo Brand Edition', quantity: 2, unitPrice: 300, taxRate: 0.08 }
    ],
    discountCode: '',
    totalAmount: 648
  },
  {
    id: 'sub-5',
    subNumber: 'QT-2026-092',
    customerName: 'Zephyr Creative Studio',
    customerEmail: 'hello@zephyrstudio.io',
    planId: 'plan-3',
    planName: 'Startup Weekly Pilot Plan',
    billingFrequency: 'weekly',
    startDate: '2026-11-05',
    expiryDate: '2026-12-05',
    nextBillingDate: '2026-11-05',
    paymentTerms: 'Due upon receipt',
    status: 'Draft',
    items: [
      { productId: 'prod-1', name: 'Brightloop ERP Business Core', variant: 'Standard Edition', quantity: 1, unitPrice: 240, taxRate: 0.10 }
    ],
    discountCode: '',
    totalAmount: 264
  }
];

export const initialInvoices = [
  {
    id: 'inv-1',
    invoiceNumber: 'INV-2026-001',
    subscriptionNumber: 'SUB-2026-001',
    customerName: 'Corner Bakery & Cafe',
    customerEmail: 'alice@cornerbakery.com',
    issueDate: '2026-10-01',
    dueDate: '2026-10-16',
    subtotal: 785,
    taxTotal: 78.50,
    discountAmount: 0,
    total: 863.50,
    amountPaid: 863.50,
    balance: 0,
    status: 'Paid', // Draft -> Confirmed -> Paid (or Overdue, Cancelled)
    items: [
      { name: 'Brightloop ERP Business Core (Standard Edition)', quantity: 3, unitPrice: 240, total: 720 },
      { name: 'Cloud Database Storage (100 GB Tier)', quantity: 1, unitPrice: 65, total: 65 }
    ]
  },
  {
    id: 'inv-2',
    invoiceNumber: 'INV-2026-002',
    subscriptionNumber: 'SUB-2026-002',
    customerName: 'Apex Logistics Global',
    customerEmail: 'marcus@apexlogistics.com',
    issueDate: '2026-09-15',
    dueDate: '2026-10-15',
    subtotal: 3500,
    taxTotal: 350,
    discountAmount: 700, // 20% discount applied automatically
    total: 3150,
    amountPaid: 3150,
    balance: 0,
    status: 'Paid',
    items: [
      { name: 'Brightloop ERP Business Core (Odoo Brand Edition)', quantity: 10, unitPrice: 300, total: 3000 },
      { name: 'Enterprise 24/7 Priority SLA', quantity: 1, unitPrice: 500, total: 500 }
    ]
  },
  {
    id: 'inv-3',
    invoiceNumber: 'INV-2026-003',
    subscriptionNumber: 'SUB-2026-003',
    customerName: 'Metro Urban Retailers',
    customerEmail: 'finance@metrourban.com',
    issueDate: '2026-09-25',
    dueDate: '2026-10-10', // Overdue!
    subtotal: 600,
    taxTotal: 48,
    discountAmount: 0,
    total: 648,
    amountPaid: 0,
    balance: 648,
    status: 'Overdue',
    daysOverdue: 21,
    items: [
      { name: 'Brightloop ERP Business Core (Odoo Brand Edition)', quantity: 2, unitPrice: 300, total: 600 }
    ]
  },
  {
    id: 'inv-4',
    invoiceNumber: 'INV-2026-004',
    subscriptionNumber: 'SUB-2026-001',
    customerName: 'Corner Bakery & Cafe',
    customerEmail: 'alice@cornerbakery.com',
    issueDate: '2026-10-28',
    dueDate: '2026-11-12',
    subtotal: 785,
    taxTotal: 78.50,
    discountAmount: 78.50, // 10% Seatboost applied
    total: 785,
    amountPaid: 0,
    balance: 785,
    status: 'Confirmed', // Awaiting payment
    items: [
      { name: 'Brightloop ERP Business Core (Standard Edition)', quantity: 3, unitPrice: 240, total: 720 },
      { name: 'Cloud Database Storage (100 GB Tier)', quantity: 1, unitPrice: 65, total: 65 }
    ]
  }
];

export const initialDiscounts = [
  {
    id: 'disc-1',
    code: 'ENTERPRISE20',
    name: 'Enterprise Volume License',
    type: 'percentage', // percentage | fixed
    value: 20, // 20%
    scope: 'whole_subscription', // whole_subscription | specific_product
    minQuantity: 5,
    minAmount: 1000,
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    usageLimit: 50,
    timesUsed: 14,
    isActive: true
  },
  {
    id: 'disc-2',
    code: 'ODOO60BOOST',
    name: 'Odoo Variant Modernization Discount',
    type: 'fixed',
    value: 60, // $60 off
    scope: 'specific_product',
    targetProductId: 'prod-1',
    minQuantity: 2,
    minAmount: 300,
    startDate: '2026-02-01',
    endDate: '2026-11-30',
    usageLimit: 30,
    timesUsed: 19,
    isActive: true
  },
  {
    id: 'disc-3',
    code: 'STARTUP500',
    name: 'Incubator Growth Grant',
    type: 'fixed',
    value: 500,
    scope: 'whole_subscription',
    minQuantity: 1,
    minAmount: 2000,
    startDate: '2026-01-01',
    endDate: '2026-08-31',
    usageLimit: 10,
    timesUsed: 10, // Exhausted/expired
    isActive: false
  },
  {
    id: 'disc-4',
    code: 'SEATBOOST10',
    name: 'Multi-Seat Growth Deal (Scene 5)',
    type: 'percentage',
    value: 10,
    scope: 'whole_subscription',
    minQuantity: 3,
    minAmount: 500,
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    usageLimit: 100,
    timesUsed: 5,
    isActive: true
  }
];

export const initialPayments = [
  {
    id: 'pay-1',
    paymentNumber: 'PAY-2026-001',
    invoiceNumber: 'INV-2026-001',
    customerName: 'Corner Bakery & Cafe',
    date: '2026-10-05',
    method: 'Credit Card (Stripe)',
    amount: 863.50,
    transactionRef: 'txn_98234710294',
    note: 'Automated recurring card settlement.',
    status: 'Completed'
  },
  {
    id: 'pay-2',
    paymentNumber: 'PAY-2026-002',
    invoiceNumber: 'INV-2026-002',
    customerName: 'Apex Logistics Global',
    date: '2026-10-02',
    method: 'Bank Wire / ACH',
    amount: 3150.00,
    transactionRef: 'WIRE-US-99210-AL',
    note: 'Annual contract payment cleared via Wells Fargo Wire.',
    status: 'Completed'
  }
];

export const defaultPersonas = [
  {
    role: 'admin',
    name: 'Elena Vance (Admin)',
    email: 'admin@brightloop.com',
    company: 'Brightloop Software Inc.',
    badge: '👑 Admin'
  },
  {
    role: 'staff',
    name: 'Sarah Jenkins (Sales / Operations)',
    email: 'sarah.ops@brightloop.com',
    company: 'Brightloop Software Inc.',
    badge: '💼 Staff'
  },
  {
    role: 'customer',
    name: 'Alice Smith (Customer Portal)',
    email: 'alice@cornerbakery.com',
    company: 'Corner Bakery & Cafe',
    badge: '🏢 Customer'
  },
  {
    role: 'staff',
    name: 'David Miller (Finance Lead)',
    email: 'david.finance@brightloop.com',
    company: 'Brightloop Software Inc.',
    badge: '📊 Finance Lead'
  }
];
