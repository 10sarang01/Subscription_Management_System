import React, { useState } from 'react';
import {
  CreditCard,
  Zap,
  Printer,
  Send,
  CheckCircle,
  Clock,
  AlertTriangle,
  FileText,
  DollarSign,
  ShieldCheck,
  Search,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowRight
} from 'lucide-react';
import { useSubscription } from '../context/SubscriptionContext';

export default function BillingPage() {
  const {
    invoices,
    runBillingDay,
    confirmInvoice,
    recordPayment,
    sendPaymentReminder
  } = useSubscription();

  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Credit Card (Stripe)');

  // Statistics
  const totalBilled = invoices.reduce((sum, inv) => sum + inv.total, 0);
  const totalCollected = invoices.reduce((sum, inv) => sum + (inv.amountPaid || 0), 0);
  const totalPending = invoices.reduce((sum, inv) => sum + (inv.balance || 0), 0);
  const overdueCount = invoices.filter((inv) => inv.status === 'Overdue').length;

  // Filtered invoices
  const filteredInvoices = invoices.filter((inv) => {
    const matchesStatus = statusFilter === 'ALL' || inv.status.toUpperCase() === statusFilter;
    const matchesSearch =
      inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.subscriptionNumber.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleOpenPayment = (inv) => {
    setSelectedInvoice(inv);
    setPaymentAmount(inv.balance.toFixed(2));
    setShowPaymentModal(true);
  };

  const handleRecordPaymentSubmit = (e) => {
    e.preventDefault();
    if (!selectedInvoice) return;
    recordPayment({
      invoiceId: selectedInvoice.id,
      amount: parseFloat(paymentAmount),
      method: paymentMethod,
      note: 'Payment settled via Billing Center'
    });
    setShowPaymentModal(false);
    setSelectedInvoice(null);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Draft':
        return <span className="status-pill status-draft">Draft</span>;
      case 'Confirmed':
        return <span className="status-pill status-confirmed">Confirmed</span>;
      case 'Paid':
        return <span className="status-pill status-paid">Paid</span>;
      case 'Overdue':
        return <span className="status-pill status-overdue">Overdue</span>;
      default:
        return <span className="status-pill status-closed">{status}</span>;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      
      {/* Hero Banner: Automated Billing Day Engine (Scene 4) */}
      <div className="neu-flat" style={{ padding: '28px 32px', background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.08), rgba(226, 232, 240, 1))' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
          <div style={{ maxWidth: '680px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Scene 4: Billing Day Automation
            </span>
            <h2 style={{ fontSize: '1.55rem', fontWeight: 800, marginTop: '4px', color: 'var(--text-main)' }}>
              Automated Recurring Invoicing Engine
            </h2>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginTop: '6px', lineHeight: 1.5 }}>
              Hundreds of subscriptions due at once? No manual typing. Generate invoices with customer details, itemized lines, automated tax rates and discounts in one click. 
            </p>
            <div style={{ display: 'flex', gap: '16px', marginTop: '12px', fontSize: '0.8rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ShieldCheck size={16} color="#16a34a" /> Double-billing prevented
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle2 size={16} color="#16a34a" /> 10% auto-tax calculation
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle2 size={16} color="#16a34a" /> Auto-discounts applied
              </span>
            </div>
          </div>

          <button
            onClick={() => runBillingDay()}
            className="neu-btn-primary"
            style={{ padding: '14px 28px', fontSize: '1rem', letterSpacing: '-0.01em' }}
          >
            <Zap size={20} />
            Run Billing Day Batch
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="metrics-grid">
        <div className="neu-flat metric-card">
          <div className="metric-header">
            <span>Total Invoiced</span>
            <CreditCard size={18} style={{ color: 'var(--primary)' }} />
          </div>
          <div className="metric-value">${totalBilled.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
          <div className="metric-trend" style={{ color: 'var(--text-muted)' }}>
            <span>{invoices.length} invoices generated</span>
          </div>
        </div>

        <div className="neu-flat metric-card">
          <div className="metric-header">
            <span>Paid Revenue</span>
            <CheckCircle size={18} style={{ color: 'var(--success)' }} />
          </div>
          <div className="metric-value">${totalCollected.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
          <div className="metric-trend" style={{ color: 'var(--success)' }}>
            <span>Settled transactions</span>
          </div>
        </div>

        <div className="neu-flat metric-card">
          <div className="metric-header">
            <span>Pending Receivables</span>
            <Clock size={18} style={{ color: '#d97706' }} />
          </div>
          <div className="metric-value">${totalPending.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
          <div className="metric-trend" style={{ color: '#d97706' }}>
            <span>Awaiting customer payment</span>
          </div>
        </div>

        <div className="neu-flat metric-card" style={{ borderLeft: '4px solid var(--error)' }}>
          <div className="metric-header">
            <span>Overdue Invoices</span>
            <AlertTriangle size={18} style={{ color: 'var(--error)' }} />
          </div>
          <div className="metric-value" style={{ color: 'var(--error)' }}>{overdueCount}</div>
          <div className="metric-trend" style={{ color: 'var(--error)' }}>
            <span>Immediate chase required</span>
          </div>
        </div>
      </div>

      {/* Invoices Table Card */}
      <div className="neu-flat" style={{ padding: '28px 30px' }}>
        
        {/* Table Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', marginBottom: '20px' }}>
          
          {/* Search Box */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '320px' }}>
            <Search size={16} style={{ position: 'absolute', left: '14px', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search invoice #, customer or contract..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="neu-inset neu-input"
              style={{ paddingLeft: '40px', paddingRight: '12px', fontSize: '0.85rem' }}
            />
          </div>

          {/* Status Tabs */}
          <div className="neu-tabs" style={{ maxWidth: '520px' }}>
            {['ALL', 'DRAFT', 'CONFIRMED', 'PAID', 'OVERDUE'].map((st) => (
              <button
                key={st}
                className={`neu-tab ${statusFilter === st ? 'active' : ''}`}
                onClick={() => setStatusFilter(st)}
                style={{ fontSize: '0.78rem', padding: '6px 14px' }}
              >
                {st}
              </button>
            ))}
          </div>

        </div>

        {/* Invoices Table */}
        <div className="table-container">
          <table className="neu-table">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Contract Ref</th>
                <th>Customer</th>
                <th>Issue Date</th>
                <th>Due Date</th>
                <th>Taxes & Discounts</th>
                <th>Total Balance</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.map((inv) => (
                <tr key={inv.id} className="table-row">
                  <td style={{ fontWeight: 800, color: 'var(--primary)' }}>
                    {inv.invoiceNumber}
                  </td>
                  <td style={{ fontWeight: 600, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    {inv.subscriptionNumber}
                  </td>
                  <td>
                    <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>{inv.customerName}</div>
                    <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>{inv.customerEmail}</div>
                  </td>
                  <td style={{ fontSize: '0.82rem' }}>{inv.issueDate}</td>
                  <td style={{ fontSize: '0.82rem', color: inv.status === 'Overdue' ? 'var(--error)' : 'var(--text-main)', fontWeight: inv.status === 'Overdue' ? 700 : 400 }}>
                    {inv.dueDate}
                  </td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    <div>Tax: +${(inv.taxTotal || 0).toFixed(2)}</div>
                    {inv.discountAmount > 0 && (
                      <div style={{ color: 'var(--success)' }}>Disc: -${inv.discountAmount.toFixed(2)}</div>
                    )}
                  </td>
                  <td>
                    <div style={{ fontWeight: 800, fontSize: '0.96rem' }}>${inv.total.toFixed(2)}</div>
                    {inv.balance > 0 && inv.status !== 'Draft' && (
                      <span style={{ fontSize: '0.74rem', color: 'var(--error)' }}>
                        Bal: ${inv.balance.toFixed(2)}
                      </span>
                    )}
                  </td>
                  <td>
                    {getStatusBadge(inv.status)}
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <button
                        onClick={() => setSelectedInvoice(inv)}
                        className="neu-btn"
                        style={{ padding: '6px 10px', fontSize: '0.76rem' }}
                        title="View & Print Invoice"
                      >
                        <FileText size={14} /> View
                      </button>

                      {inv.status === 'Draft' && (
                        <button
                          onClick={() => confirmInvoice(inv.id)}
                          className="neu-btn-primary"
                          style={{ padding: '6px 10px', fontSize: '0.76rem' }}
                          title="Confirm and send to customer"
                        >
                          Confirm
                        </button>
                      )}

                      {(inv.status === 'Confirmed' || inv.status === 'Overdue' || inv.status === 'Partially Paid') && (
                        <button
                          onClick={() => handleOpenPayment(inv)}
                          className="neu-btn"
                          style={{ padding: '6px 10px', fontSize: '0.76rem', color: 'var(--success)' }}
                          title="Record customer payment"
                        >
                          <DollarSign size={14} /> Pay
                        </button>
                      )}

                      {inv.status === 'Overdue' && (
                        <button
                          onClick={() => sendPaymentReminder(inv.id)}
                          className="neu-btn"
                          style={{ padding: '6px 10px', fontSize: '0.76rem', color: 'var(--error)' }}
                          title="Send reminder to customer"
                        >
                          <Send size={14} /> Chase
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>

      {/* Invoice Printable Preview Modal */}
      {selectedInvoice && !showPaymentModal && (
        <div className="modal-overlay" onClick={() => setSelectedInvoice(null)}>
          <div className="modal-card animate-fade-in" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '750px', background: '#ffffff', color: '#1e293b' }}>
            
            {/* Modal Actions Top Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '14px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => window.print()}
                  className="neu-btn"
                  style={{ padding: '8px 16px', fontSize: '0.82rem' }}
                >
                  <Printer size={15} /> Print / Save PDF
                </button>
                {selectedInvoice.status === 'Draft' && (
                  <button
                    onClick={() => {
                      confirmInvoice(selectedInvoice.id);
                      setSelectedInvoice({ ...selectedInvoice, status: 'Confirmed' });
                    }}
                    className="neu-btn-primary"
                    style={{ padding: '8px 16px', fontSize: '0.82rem' }}
                  >
                    Confirm Invoice
                  </button>
                )}
                {selectedInvoice.balance > 0 && selectedInvoice.status !== 'Draft' && (
                  <button
                    onClick={() => setShowPaymentModal(true)}
                    className="neu-btn"
                    style={{ padding: '8px 16px', fontSize: '0.82rem', color: 'var(--success)' }}
                  >
                    <DollarSign size={15} /> Record Payment
                  </button>
                )}
              </div>

              <button onClick={() => setSelectedInvoice(null)} className="neu-btn" style={{ padding: '6px 12px' }}>
                ✕
              </button>
            </div>

            {/* Printable Document Body */}
            <div style={{ padding: '10px 16px' }}>
              
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
                <div>
                  <h2 style={{ fontSize: '1.6rem', fontWeight: 900, color: '#4f46e5' }}>
                    BRIGHTLOOP <span style={{ color: '#1e293b' }}>SYSTEMS</span>
                  </h2>
                  <p style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '2px' }}>
                    Enterprise Subscription & Cloud Platform Inc.<br />
                    100 Tech Boulevard, Suite 400<br />
                    billing@brightloop.com
                  </p>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a' }}>
                    INVOICE
                  </h3>
                  <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#4f46e5', marginTop: '2px' }}>
                    {selectedInvoice.invoiceNumber}
                  </div>
                  <div style={{ marginTop: '6px' }}>
                    {getStatusBadge(selectedInvoice.status)}
                  </div>
                </div>
              </div>

              {/* Bill To & Meta Info */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', padding: '16px', backgroundColor: '#f8fafc', borderRadius: '12px', marginBottom: '28px' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Billed To:</div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>{selectedInvoice.customerName}</div>
                  <div style={{ fontSize: '0.84rem', color: '#64748b' }}>{selectedInvoice.customerEmail}</div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '4px' }}>Contract Ref: <strong>{selectedInvoice.subscriptionNumber}</strong></div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.84rem', color: '#64748b' }}>
                    Issue Date: <strong>{selectedInvoice.issueDate}</strong>
                  </div>
                  <div style={{ fontSize: '0.84rem', color: '#64748b', marginTop: '4px' }}>
                    Due Date: <strong style={{ color: selectedInvoice.status === 'Overdue' ? '#dc2626' : '#0f172a' }}>{selectedInvoice.dueDate}</strong>
                  </div>
                  <div style={{ fontSize: '0.84rem', color: '#64748b', marginTop: '4px' }}>
                    Payment Terms: <strong>Net 15 Days</strong>
                  </div>
                </div>
              </div>

              {/* Line Items Table */}
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#64748b', fontSize: '0.78rem', textTransform: 'uppercase', textAlign: 'left' }}>
                    <th style={{ padding: '10px 8px' }}>Item Description</th>
                    <th style={{ padding: '10px 8px', textAlign: 'center' }}>Qty</th>
                    <th style={{ padding: '10px 8px', textAlign: 'right' }}>Unit Price</th>
                    <th style={{ padding: '10px 8px', textAlign: 'right' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedInvoice.items && selectedInvoice.items.map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.88rem' }}>
                      <td style={{ padding: '12px 8px', fontWeight: 600 }}>{item.name}</td>
                      <td style={{ padding: '12px 8px', textAlign: 'center' }}>{item.quantity}</td>
                      <td style={{ padding: '12px 8px', textAlign: 'right' }}>${item.unitPrice.toFixed(2)}</td>
                      <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 700 }}>${item.total.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals Section */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' }}>
                <div style={{ width: '280px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.9rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                    <span>Subtotal:</span>
                    <span>${selectedInvoice.subtotal.toFixed(2)}</span>
                  </div>
                  {selectedInvoice.discountAmount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#16a34a', fontWeight: 600 }}>
                      <span>Discount:</span>
                      <span>-${selectedInvoice.discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                    <span>Automated Taxes (10%):</span>
                    <span>+${(selectedInvoice.taxTotal || 0).toFixed(2)}</span>
                  </div>
                  <div style={{ height: '1px', background: '#cbd5e1', margin: '4px 0' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
                    <span>Total Amount:</span>
                    <span>${selectedInvoice.total.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: selectedInvoice.balance > 0 ? '#dc2626' : '#16a34a', fontWeight: 700 }}>
                    <span>Balance Due:</span>
                    <span>${selectedInvoice.balance.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Footer Note */}
              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '16px', fontSize: '0.78rem', color: '#94a3b8', textAlign: 'center' }}>
                Thank you for subscribing to Brightloop Systems. Bank Wire, Stripe and Credit Card accepted.
              </div>

            </div>

          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {showPaymentModal && selectedInvoice && (
        <div className="modal-overlay" onClick={() => setShowPaymentModal(false)}>
          <div className="modal-card animate-fade-in" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '6px' }}>
              Record Payment
            </h3>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginBottom: '18px' }}>
              Invoice: <strong>{selectedInvoice.invoiceNumber}</strong> ({selectedInvoice.customerName})
            </p>

            <form onSubmit={handleRecordPaymentSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  Amount to Pay ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="neu-inset neu-input"
                />
                <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                  Outstanding Balance: ${selectedInvoice.balance.toFixed(2)}
                </span>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="neu-inset neu-input"
                >
                  <option value="Credit Card (Stripe)">Credit Card (Stripe)</option>
                  <option value="Bank Wire / ACH">Bank Wire / ACH</option>
                  <option value="Direct Debit">Direct Debit</option>
                  <option value="Corporate Check">Corporate Check</option>
                  <option value="Cash Settlement">Cash Settlement</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="neu-btn"
                  style={{ padding: '10px 18px', fontSize: '0.86rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="neu-btn-primary"
                  style={{ padding: '10px 22px', fontSize: '0.86rem' }}
                >
                  Confirm & Settle Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
