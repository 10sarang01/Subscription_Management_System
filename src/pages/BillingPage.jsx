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
  XCircle,
  Layers,
  ArrowRight,
  RefreshCw,
  Mail,
  Ban,
  ChevronDown,
  Info
} from 'lucide-react';
import { useSubscription } from '../context/SubscriptionContext';

export default function BillingPage() {
  const {
    invoices,
    subscriptions,
    runBillingDay,
    getDueSubscriptions,
    confirmInvoice,
    cancelInvoice,
    sendInvoice,
    recordPayment,
    sendPaymentReminder
  } = useSubscription();

  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Credit Card (Stripe)');
  const [billingDate, setBillingDate] = useState(() => {
    // Default to current date or 2026-10-31
    const now = new Date();
    return now.toISOString().split('T')[0];
  });
  const [showDueList, setShowDueList] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Statistics
  const totalBilled = invoices.filter(i => i.status !== 'Cancelled').reduce((sum, inv) => sum + inv.total, 0);
  const totalCollected = invoices.reduce((sum, inv) => sum + (inv.amountPaid || 0), 0);
  const totalPending = invoices.filter(i => i.status !== 'Cancelled').reduce((sum, inv) => sum + (inv.balance || 0), 0);
  const overdueCount = invoices.filter((inv) => inv.status === 'Overdue').length;

  // Due subscriptions preview
  const { due: dueSubscriptions, alreadyBilled } = getDueSubscriptions(billingDate);
  const expectedBatchTotal = dueSubscriptions.reduce((sum, s) => {
    const subtotal = s.items?.reduce((st, it) => st + (it.quantity * it.unitPrice), 0) || s.totalAmount || 0;
    return sum + (subtotal * 1.10); // estimate with 10% tax
  }, 0);

  // Filtered invoices
  const filteredInvoices = invoices.filter((inv) => {
    const matchesStatus = statusFilter === 'ALL' || inv.status.toUpperCase() === statusFilter;
    const matchesSearch =
      inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (inv.customerEmail && inv.customerEmail.toLowerCase().includes(searchQuery.toLowerCase())) ||
      inv.subscriptionNumber.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleRunBilling = () => {
    setIsProcessing(true);
    setTimeout(() => {
      runBillingDay(billingDate);
      setIsProcessing(false);
    }, 400);
  };

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
      note: 'Settled via Automated Billing Center'
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
      case 'Cancelled':
        return <span className="status-pill" style={{ background: '#f1f5f9', color: '#64748b', textDecoration: 'line-through' }}>Cancelled</span>;
      default:
        return <span className="status-pill status-closed">{status}</span>;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '26px' }}>
      
      {/* Hero Banner: Automated Billing Day Engine (Scene 4) */}
      <div className="neu-flat" style={{
        padding: '28px 32px',
        background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.08) 0%, rgba(248, 250, 252, 0.95) 100%)',
        border: '1px solid rgba(79, 70, 229, 0.15)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '24px' }}>
          
          <div style={{ maxWidth: '640px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--primary)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Scene 4: Billing Day Engine
              </span>
              <span style={{ fontSize: '0.72rem', background: '#e0e7ff', color: '#4338ca', padding: '2px 8px', borderRadius: '12px', fontWeight: 700 }}>
                High-Volume Recurring Automation
              </span>
            </div>

            <h2 style={{ fontSize: '1.65rem', fontWeight: 800, marginTop: '6px', color: '#0f172a', letterSpacing: '-0.02em' }}>
              Automated Recurring Invoicing & Billing Run
            </h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '8px', lineHeight: 1.55 }}>
              Hundreds of subscriptions due at once? No manual data entry. Invoices are automatically generated with customer details, product lines, tax calculations, and discount rules applied in one execution.
            </p>

            {/* Badges / Guarantees */}
            <div style={{ display: 'flex', gap: '18px', marginTop: '16px', fontSize: '0.82rem', color: '#334155', flexWrap: 'wrap' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                <ShieldCheck size={17} color="#16a34a" /> Double-Billing Prevented
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                <CheckCircle2 size={17} color="#16a34a" /> Automated Rule-Based Taxes
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                <CheckCircle2 size={17} color="#16a34a" /> Auto-Discount Deduction
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                <Calendar size={17} color="#4f46e5" /> Auto-Advance Next Cycle
              </span>
            </div>
          </div>

          {/* Interactive Billing Day Trigger Panel */}
          <div className="neu-flat-sm" style={{
            padding: '20px 24px',
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            minWidth: '320px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Billing Cut-Off Date
              </label>
              <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600 }}>
                {dueSubscriptions.length} contracts due
              </span>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="date"
                value={billingDate}
                onChange={(e) => setBillingDate(e.target.value)}
                className="neu-inset"
                style={{
                  flex: 1,
                  padding: '9px 12px',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  color: '#0f172a',
                  border: '1px solid #cbd5e1'
                }}
              />
              <button
                type="button"
                onClick={() => setBillingDate(new Date().toISOString().split('T')[0])}
                className="neu-btn"
                style={{ padding: '8px 12px', fontSize: '0.78rem' }}
                title="Reset to today"
              >
                Today
              </button>
            </div>

            {/* Live Due Status Indicator */}
            <div style={{
              padding: '10px 14px',
              borderRadius: '10px',
              backgroundColor: dueSubscriptions.length > 0 ? '#eff6ff' : '#f8fafc',
              border: dueSubscriptions.length > 0 ? '1px solid #bfdbfe' : '1px solid #e2e8f0',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.84rem', fontWeight: 700, color: dueSubscriptions.length > 0 ? '#1e40af' : '#64748b' }}>
                  {dueSubscriptions.length > 0
                    ? `⚡ ${dueSubscriptions.length} Subscription${dueSubscriptions.length > 1 ? 's' : ''} Ready to Bill`
                    : '✅ All Subscriptions Up-To-Date'}
                </span>
                {dueSubscriptions.length > 0 && (
                  <button
                    onClick={() => setShowDueList(!showDueList)}
                    style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '0.76rem', fontWeight: 700, cursor: 'pointer' }}
                  >
                    {showDueList ? 'Hide details' : 'View list'}
                  </button>
                )}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                {dueSubscriptions.length > 0
                  ? `Estimated gross run: ~$${expectedBatchTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                  : `${alreadyBilled.length} contracts previously billed in this cycle.`}
              </div>

              {/* Collapsible Due Subscriptions List */}
              {showDueList && dueSubscriptions.length > 0 && (
                <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #dbeafe', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {dueSubscriptions.map((s) => (
                    <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', color: '#1e3a8a' }}>
                      <span style={{ fontWeight: 600 }}>{s.customerName} ({s.subNumber})</span>
                      <span style={{ color: '#475569' }}>Due: {s.nextBillingDate || 'Today'}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Batch Run Action Button */}
            <button
              onClick={handleRunBilling}
              disabled={isProcessing || dueSubscriptions.length === 0}
              className="neu-btn-primary"
              style={{
                width: '100%',
                padding: '13px 20px',
                fontSize: '0.96rem',
                letterSpacing: '-0.01em',
                opacity: dueSubscriptions.length === 0 ? 0.6 : 1,
                cursor: dueSubscriptions.length === 0 ? 'not-allowed' : 'pointer'
              }}
            >
              <Zap size={18} className={isProcessing ? 'spin' : ''} />
              {isProcessing
                ? 'Processing Batch Invoices...'
                : dueSubscriptions.length > 0
                ? `⚡ Run Billing Day Batch (${dueSubscriptions.length})`
                : 'No Contracts Due'}
            </button>
          </div>

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
            <span>{invoices.filter(i => i.status !== 'Cancelled').length} active invoices generated</span>
          </div>
        </div>

        <div className="neu-flat metric-card">
          <div className="metric-header">
            <span>Paid Revenue</span>
            <CheckCircle size={18} style={{ color: 'var(--success)' }} />
          </div>
          <div className="metric-value">${totalCollected.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
          <div className="metric-trend" style={{ color: 'var(--success)' }}>
            <span>Settled & cleared collections</span>
          </div>
        </div>

        <div className="neu-flat metric-card">
          <div className="metric-header">
            <span>Pending Receivables</span>
            <Clock size={18} style={{ color: '#d97706' }} />
          </div>
          <div className="metric-value">${totalPending.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
          <div className="metric-trend" style={{ color: '#d97706' }}>
            <span>Outstanding customer balances</span>
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', marginBottom: '22px' }}>
          
          {/* Search Box */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '340px' }}>
            <Search size={16} style={{ position: 'absolute', left: '14px', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search invoice #, customer or contract..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="neu-inset neu-input"
              style={{ paddingLeft: '40px', paddingRight: '12px', fontSize: '0.86rem' }}
            />
          </div>

          {/* Status Tabs */}
          <div className="neu-tabs" style={{ maxWidth: '640px' }}>
            {[
              { id: 'ALL', label: 'All', count: invoices.length },
              { id: 'DRAFT', label: 'Draft', count: invoices.filter(i => i.status === 'Draft').length },
              { id: 'CONFIRMED', label: 'Confirmed', count: invoices.filter(i => i.status === 'Confirmed').length },
              { id: 'PAID', label: 'Paid', count: invoices.filter(i => i.status === 'Paid').length },
              { id: 'OVERDUE', label: 'Overdue', count: invoices.filter(i => i.status === 'Overdue').length },
              { id: 'CANCELLED', label: 'Cancelled', count: invoices.filter(i => i.status === 'Cancelled').length }
            ].map((tab) => (
              <button
                key={tab.id}
                className={`neu-tab ${statusFilter === tab.id ? 'active' : ''}`}
                onClick={() => setStatusFilter(tab.id)}
                style={{ fontSize: '0.78rem', padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <span>{tab.label}</span>
                <span style={{
                  fontSize: '0.68rem',
                  padding: '1px 6px',
                  borderRadius: '10px',
                  background: statusFilter === tab.id ? 'var(--primary)' : 'rgba(100, 116, 139, 0.15)',
                  color: statusFilter === tab.id ? '#ffffff' : 'inherit'
                }}>
                  {tab.count}
                </span>
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
                <th>Customer Entity</th>
                <th>Billing Period / Dates</th>
                <th>Taxes & Discount</th>
                <th>Total Balance</th>
                <th>Status</th>
                <th>Dispatch</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    No invoices matching current filter criteria.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="table-row">
                    <td style={{ fontWeight: 800, color: 'var(--primary)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <FileText size={15} />
                        <span>{inv.invoiceNumber}</span>
                      </div>
                    </td>
                    <td style={{ fontWeight: 600, fontSize: '0.82rem', color: '#475569' }}>
                      {inv.subscriptionNumber}
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>{inv.customerName}</div>
                      <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>{inv.customerEmail}</div>
                    </td>
                    <td style={{ fontSize: '0.82rem' }}>
                      <div>Issued: <strong>{inv.issueDate}</strong></div>
                      <div style={{
                        marginTop: '2px',
                        color: inv.status === 'Overdue' ? '#dc2626' : '#64748b',
                        fontWeight: inv.status === 'Overdue' ? 700 : 400
                      }}>
                        Due: <strong>{inv.dueDate}</strong>
                      </div>
                      {inv.billingPeriodStart && (
                        <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '2px' }}>
                          Cycle: {inv.billingPeriodStart.slice(5)} to {inv.billingPeriodEnd?.slice(5)}
                        </div>
                      )}
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      <div>Tax: +${(inv.taxTotal || 0).toFixed(2)}</div>
                      {inv.discountAmount > 0 && (
                        <div style={{ color: 'var(--success)', fontWeight: 600 }}>
                          Disc: -${inv.discountAmount.toFixed(2)}
                        </div>
                      )}
                    </td>
                    <td>
                      <div style={{ fontWeight: 800, fontSize: '0.96rem' }}>${inv.total.toFixed(2)}</div>
                      {inv.balance > 0 && inv.status !== 'Draft' && inv.status !== 'Cancelled' && (
                        <span style={{ fontSize: '0.74rem', color: 'var(--error)', fontWeight: 600 }}>
                          Bal: ${inv.balance.toFixed(2)}
                        </span>
                      )}
                      {inv.amountPaid > 0 && (
                        <div style={{ fontSize: '0.72rem', color: '#16a34a' }}>
                          Paid: ${inv.amountPaid.toFixed(2)}
                        </div>
                      )}
                    </td>
                    <td>
                      {getStatusBadge(inv.status)}
                    </td>
                    <td>
                      {inv.sentAt ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: '#15803d', fontWeight: 600 }}>
                          <CheckCircle2 size={13} /> Sent
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                          Draft / Unsent
                        </span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {/* View & Print Action */}
                        <button
                          onClick={() => setSelectedInvoice(inv)}
                          className="neu-btn"
                          style={{ padding: '6px 10px', fontSize: '0.76rem' }}
                          title="View & Print Invoice"
                        >
                          <Printer size={13} /> View
                        </button>

                        {/* Confirm Action for Drafts */}
                        {inv.status === 'Draft' && (
                          <button
                            onClick={() => confirmInvoice(inv.id)}
                            className="neu-btn-primary"
                            style={{ padding: '6px 10px', fontSize: '0.76rem' }}
                            title="Confirm and move to Confirmed"
                          >
                            Confirm
                          </button>
                        )}

                        {/* Send to Customer Email */}
                        {inv.status !== 'Cancelled' && (
                          <button
                            onClick={() => sendInvoice(inv.id)}
                            className="neu-btn"
                            style={{ padding: '6px 10px', fontSize: '0.76rem', color: '#4f46e5' }}
                            title="Send invoice to customer email"
                          >
                            <Mail size={13} /> Send
                          </button>
                        )}

                        {/* Pay Action */}
                        {inv.balance > 0 && inv.status !== 'Draft' && inv.status !== 'Cancelled' && (
                          <button
                            onClick={() => handleOpenPayment(inv)}
                            className="neu-btn"
                            style={{ padding: '6px 10px', fontSize: '0.76rem', color: 'var(--success)' }}
                            title="Record customer payment"
                          >
                            <DollarSign size={13} /> Pay
                          </button>
                        )}

                        {/* Overdue Chase */}
                        {inv.status === 'Overdue' && (
                          <button
                            onClick={() => sendPaymentReminder(inv.id)}
                            className="neu-btn"
                            style={{ padding: '6px 10px', fontSize: '0.76rem', color: 'var(--error)' }}
                            title="Send payment reminder"
                          >
                            <Send size={13} /> Chase
                          </button>
                        )}

                        {/* Cancel Invoice Action (Scene 4: "The team can confirm, cancel, send or print") */}
                        {inv.status !== 'Paid' && inv.status !== 'Cancelled' && (
                          <button
                            onClick={() => cancelInvoice(inv.id)}
                            className="neu-btn"
                            style={{ padding: '6px 8px', fontSize: '0.76rem', color: '#94a3b8' }}
                            title="Cancel Invoice"
                          >
                            <Ban size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* Invoice Printable Preview Modal (Scene 4: Print/PDF) */}
      {selectedInvoice && !showPaymentModal && (
        <div className="modal-overlay" onClick={() => setSelectedInvoice(null)}>
          <div className="modal-card animate-fade-in" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '780px', background: '#ffffff', color: '#1e293b' }}>
            
            {/* Modal Actions Top Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '14px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => window.print()}
                  className="neu-btn"
                  style={{ padding: '8px 16px', fontSize: '0.84rem' }}
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
                    style={{ padding: '8px 16px', fontSize: '0.84rem' }}
                  >
                    Confirm Invoice
                  </button>
                )}

                {selectedInvoice.status !== 'Cancelled' && (
                  <button
                    onClick={() => {
                      sendInvoice(selectedInvoice.id);
                      setSelectedInvoice({ ...selectedInvoice, sentAt: new Date().toISOString() });
                    }}
                    className="neu-btn"
                    style={{ padding: '8px 16px', fontSize: '0.84rem', color: '#4f46e5' }}
                  >
                    <Mail size={15} /> Send to Customer
                  </button>
                )}

                {selectedInvoice.balance > 0 && selectedInvoice.status !== 'Draft' && selectedInvoice.status !== 'Cancelled' && (
                  <button
                    onClick={() => setShowPaymentModal(true)}
                    className="neu-btn"
                    style={{ padding: '8px 16px', fontSize: '0.84rem', color: 'var(--success)' }}
                  >
                    <DollarSign size={15} /> Record Payment
                  </button>
                )}

                {selectedInvoice.status !== 'Paid' && selectedInvoice.status !== 'Cancelled' && (
                  <button
                    onClick={() => {
                      cancelInvoice(selectedInvoice.id);
                      setSelectedInvoice({ ...selectedInvoice, status: 'Cancelled', balance: 0 });
                    }}
                    className="neu-btn"
                    style={{ padding: '8px 14px', fontSize: '0.84rem', color: '#94a3b8' }}
                  >
                    <Ban size={15} /> Cancel Invoice
                  </button>
                )}
              </div>

              <button onClick={() => setSelectedInvoice(null)} className="neu-btn" style={{ padding: '6px 12px' }}>
                ✕
              </button>
            </div>

            {/* Printable Document Body */}
            <div style={{ padding: '8px 12px' }}>
              
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
                <div>
                  <h2 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#4f46e5', letterSpacing: '-0.02em' }}>
                    BRIGHTLOOP <span style={{ color: '#0f172a' }}>SYSTEMS</span>
                  </h2>
                  <p style={{ fontSize: '0.84rem', color: '#64748b', marginTop: '4px', lineHeight: 1.5 }}>
                    Enterprise Subscription & Cloud Platform Inc.<br />
                    100 Tech Boulevard, Suite 400 • billing@brightloop.com<br />
                    Tax ID / VAT: US-99238471
                  </p>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0f172a', letterSpacing: '0.04em' }}>
                    INVOICE
                  </h3>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: '#4f46e5', marginTop: '2px' }}>
                    {selectedInvoice.invoiceNumber}
                  </div>
                  <div style={{ marginTop: '8px' }}>
                    {getStatusBadge(selectedInvoice.status)}
                  </div>
                </div>
              </div>

              {/* Bill To & Meta Info */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', padding: '18px', backgroundColor: '#f8fafc', borderRadius: '12px', marginBottom: '24px', border: '1px solid #e2e8f0' }}>
                <div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Billed To:</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>{selectedInvoice.customerName}</div>
                  <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{selectedInvoice.customerEmail}</div>
                  <div style={{ fontSize: '0.82rem', color: '#475569', marginTop: '6px' }}>
                    Contract Reference: <strong>{selectedInvoice.subscriptionNumber}</strong>
                  </div>
                </div>

                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ fontSize: '0.86rem', color: '#475569' }}>
                    Issue Date: <strong>{selectedInvoice.issueDate}</strong>
                  </div>
                  <div style={{ fontSize: '0.86rem', color: '#475569' }}>
                    Due Date: <strong style={{ color: selectedInvoice.status === 'Overdue' ? '#dc2626' : '#0f172a' }}>{selectedInvoice.dueDate}</strong>
                  </div>
                  {selectedInvoice.billingPeriodStart && (
                    <div style={{ fontSize: '0.82rem', color: '#64748b' }}>
                      Billing Period: <strong>{selectedInvoice.billingPeriodStart} to {selectedInvoice.billingPeriodEnd}</strong>
                    </div>
                  )}
                  <div style={{ fontSize: '0.82rem', color: '#64748b' }}>
                    Payment Terms: <strong>Net 15 Days</strong>
                  </div>
                </div>
              </div>

              {/* Line Items Table */}
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #cbd5e1', color: '#475569', fontSize: '0.8rem', textTransform: 'uppercase', textAlign: 'left', letterSpacing: '0.03em' }}>
                    <th style={{ padding: '10px 8px' }}>Line Item Description</th>
                    <th style={{ padding: '10px 8px', textAlign: 'center' }}>Qty</th>
                    <th style={{ padding: '10px 8px', textAlign: 'right' }}>Unit Price</th>
                    <th style={{ padding: '10px 8px', textAlign: 'right' }}>Tax Rule</th>
                    <th style={{ padding: '10px 8px', textAlign: 'right' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedInvoice.items && selectedInvoice.items.map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.88rem' }}>
                      <td style={{ padding: '12px 8px', fontWeight: 600, color: '#0f172a' }}>{item.name}</td>
                      <td style={{ padding: '12px 8px', textAlign: 'center', color: '#475569' }}>{item.quantity}</td>
                      <td style={{ padding: '12px 8px', textAlign: 'right', color: '#475569' }}>${item.unitPrice.toFixed(2)}</td>
                      <td style={{ padding: '12px 8px', textAlign: 'right', color: '#64748b', fontSize: '0.82rem' }}>
                        {item.taxRate ? `${(item.taxRate * 100).toFixed(0)}% VAT` : '10% VAT'}
                      </td>
                      <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>${item.total.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals Section */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' }}>
                <div style={{ width: '300px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.9rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                    <span>Subtotal:</span>
                    <span>${selectedInvoice.subtotal.toFixed(2)}</span>
                  </div>

                  {selectedInvoice.discountAmount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#16a34a', fontWeight: 600 }}>
                      <span>Discount {selectedInvoice.discountCode ? `(${selectedInvoice.discountCode})` : ''}:</span>
                      <span>-${selectedInvoice.discountAmount.toFixed(2)}</span>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                    <span>Automated Taxes:</span>
                    <span>+${(selectedInvoice.taxTotal || 0).toFixed(2)}</span>
                  </div>

                  <div style={{ height: '1px', background: '#cbd5e1', margin: '4px 0' }} />

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                    <span>Total Amount:</span>
                    <span>${selectedInvoice.total.toFixed(2)}</span>
                  </div>

                  {selectedInvoice.amountPaid > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#16a34a', fontWeight: 700 }}>
                      <span>Amount Paid:</span>
                      <span>${selectedInvoice.amountPaid.toFixed(2)}</span>
                    </div>
                  )}

                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    backgroundColor: selectedInvoice.balance > 0 ? '#fef2f2' : '#f0fdf4',
                    color: selectedInvoice.balance > 0 ? '#b91c1c' : '#15803d',
                    fontWeight: 800,
                    fontSize: '1.05rem',
                    marginTop: '4px'
                  }}>
                    <span>Balance Due:</span>
                    <span>${selectedInvoice.balance.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Footer Note */}
              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '16px', fontSize: '0.78rem', color: '#94a3b8', textAlign: 'center' }}>
                Brightloop Systems Inc. • Remit payments via Bank Wire (ACH/SWIFT), Stripe or Online Portal.
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
              Record Customer Payment
            </h3>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginBottom: '18px' }}>
              Invoice: <strong>{selectedInvoice.invoiceNumber}</strong> ({selectedInvoice.customerName})
            </p>

            <form onSubmit={handleRecordPaymentSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  Payment Amount ($)
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
                  Current Outstanding Balance: ${selectedInvoice.balance.toFixed(2)}
                </span>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  Payment Method (Scene 6)
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
                  <option value="Online Customer Portal">Online Customer Portal</option>
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
                  <DollarSign size={16} /> Confirm & Settle Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
