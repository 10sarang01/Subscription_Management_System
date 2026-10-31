import React, { useState } from 'react';
import {
  DollarSign,
  Plus,
  Send,
  AlertTriangle,
  CheckCircle2,
  Clock,
  CreditCard,
  Building,
  Receipt,
  Search,
  ShieldCheck,
  FileText
} from 'lucide-react';
import { useSubscription } from '../context/SubscriptionContext';

export default function PaymentsPage() {
  const {
    payments,
    invoices,
    recordPayment,
    sendPaymentReminder
  } = useSubscription();

  const [showModal, setShowModal] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Credit Card (Stripe)');
  const [paymentNote, setPaymentNote] = useState('');
  const [transactionRef, setTransactionRef] = useState('');

  // Unpaid invoices
  const unpaidInvoices = invoices.filter(
    (i) => i.balance > 0 && i.status !== 'Draft' && i.status !== 'Cancelled'
  );

  const totalCollected = payments.reduce((sum, p) => sum + p.amount, 0);
  const totalOutstanding = unpaidInvoices.reduce((sum, i) => sum + i.balance, 0);

  const handleOpenRecordModal = (inv = null) => {
    if (inv) {
      setSelectedInvoiceId(inv.id);
      setPaymentAmount(inv.balance.toFixed(2));
    } else if (unpaidInvoices.length > 0) {
      setSelectedInvoiceId(unpaidInvoices[0].id);
      setPaymentAmount(unpaidInvoices[0].balance.toFixed(2));
    } else {
      setSelectedInvoiceId('');
      setPaymentAmount('');
    }
    setTransactionRef('');
    setPaymentNote('Settlement processed via Payments center');
    setShowModal(true);
  };

  const handleInvoiceChange = (invId) => {
    setSelectedInvoiceId(invId);
    const target = unpaidInvoices.find((i) => String(i.id) === String(invId));
    if (target) {
      setPaymentAmount(target.balance.toFixed(2));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedInvoiceId) return;

    const recorded = await recordPayment({
      invoiceId: selectedInvoiceId,
      amount: parseFloat(paymentAmount),
      method: paymentMethod,
      note: paymentNote,
      transactionRef
    });

    if (recorded) setShowModal(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      
      {/* Top Banner */}
      <div className="neu-flat" style={{ padding: '24px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Scene 6: Money & Collections Management
          </span>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, marginTop: '4px', color: 'var(--text-main)' }}>
            Payments & Receivables Reconciliation
          </h2>
          <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Record payments across diverse payment methods, track outstanding balances, and chase overdue revenue.
          </p>
        </div>

        <button
          onClick={() => handleOpenRecordModal()}
          className="neu-btn-primary"
          style={{ padding: '10px 20px', fontSize: '0.86rem' }}
        >
          <Plus size={16} /> Record Inbound Payment
        </button>
      </div>

      {/* KPI Cards */}
      <div className="metrics-grid">
        <div className="neu-flat metric-card">
          <div className="metric-header">
            <span>Total Collected Cash</span>
            <CheckCircle2 size={18} style={{ color: 'var(--success)' }} />
          </div>
          <div className="metric-value">
            ${totalCollected.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="metric-trend" style={{ color: 'var(--success)' }}>
            <span>{payments.length} transactions completed</span>
          </div>
        </div>

        <div className="neu-flat metric-card">
          <div className="metric-header">
            <span>Outstanding Invoices Total</span>
            <Clock size={18} style={{ color: '#d97706' }} />
          </div>
          <div className="metric-value">
            ${totalOutstanding.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="metric-trend" style={{ color: '#d97706' }}>
            <span>{unpaidInvoices.length} invoices pending payment</span>
          </div>
        </div>
      </div>

      {/* Outstanding & Overdue Invoices Alert Panel */}
      <div className="neu-flat" style={{ padding: '28px 30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={18} style={{ color: '#d97706' }} />
              Live Outstanding Invoices ({unpaidInvoices.length})
            </h3>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Monitor invoices awaiting payment and chase overdue accounts immediately
            </p>
          </div>
        </div>

        {unpaidInvoices.length === 0 ? (
          <div className="neu-inset-sm" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <CheckCircle2 size={32} style={{ color: 'var(--success)', margin: '0 auto 8px auto' }} />
            <div style={{ fontWeight: 700 }}>All Invoices Fully Settled!</div>
            <p style={{ fontSize: '0.82rem' }}>No outstanding or overdue balances currently on the books.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="neu-table">
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Customer</th>
                  <th>Due Date</th>
                  <th>Total Amount</th>
                  <th>Balance Owed</th>
                  <th>Status</th>
                  <th>Collections Action</th>
                </tr>
              </thead>
              <tbody>
                {unpaidInvoices.map((inv) => (
                  <tr key={inv.id} className="table-row">
                    <td style={{ fontWeight: 800, color: 'var(--primary)' }}>
                      {inv.invoiceNumber}
                    </td>
                    <td>
                      <div style={{ fontWeight: 700 }}>{inv.customerName}</div>
                      <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>{inv.customerEmail}</div>
                    </td>
                    <td style={{ fontSize: '0.84rem', color: inv.status === 'Overdue' ? 'var(--error)' : 'var(--text-main)', fontWeight: inv.status === 'Overdue' ? 700 : 400 }}>
                      {inv.dueDate} {inv.status === 'Overdue' ? `(${inv.daysOverdue || 15}d overdue)` : ''}
                    </td>
                    <td style={{ fontWeight: 600 }}>${inv.total.toFixed(2)}</td>
                    <td style={{ fontWeight: 800, fontSize: '1rem', color: inv.status === 'Overdue' ? 'var(--error)' : '#d97706' }}>
                      ${inv.balance.toFixed(2)}
                    </td>
                    <td>
                      <span className={`status-pill status-${inv.status.toLowerCase().replace(' ', '-')}`}>
                        {inv.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => handleOpenRecordModal(inv)}
                          className="neu-btn-primary"
                          style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                        >
                          <DollarSign size={13} /> Settle
                        </button>
                        <button
                          onClick={() => sendPaymentReminder(inv.id)}
                          className="neu-btn"
                          style={{ padding: '6px 12px', fontSize: '0.78rem', color: 'var(--primary)' }}
                          title="Dispatch chase reminder email"
                        >
                          <Send size={13} /> Chase
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Settled Payments Ledger Table */}
      <div className="neu-flat" style={{ padding: '28px 30px' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '6px' }}>
          Payments Received Ledger ({payments.length})
        </h3>
        <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
          Audited log of cleared transactions with payment methods and reference IDs
        </p>

        <div className="table-container">
          <table className="neu-table">
            <thead>
              <tr>
                <th>Payment Ref #</th>
                <th>Invoice Ref</th>
                <th>Customer Name</th>
                <th>Payment Date</th>
                <th>Method</th>
                <th>Amount Paid</th>
                <th>Transaction ID</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id} className="table-row">
                  <td style={{ fontWeight: 800, color: 'var(--primary)' }}>
                    {p.paymentNumber}
                  </td>
                  <td style={{ fontWeight: 600, fontSize: '0.84rem' }}>
                    {p.invoiceNumber}
                  </td>
                  <td style={{ fontWeight: 700 }}>
                    {p.customerName}
                  </td>
                  <td style={{ fontSize: '0.82rem' }}>{p.date}</td>
                  <td>
                    <span className="neu-inset-sm" style={{ padding: '4px 8px', fontSize: '0.76rem', fontWeight: 600 }}>
                      {p.method}
                    </span>
                  </td>
                  <td style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--success)' }}>
                    +${p.amount.toFixed(2)}
                  </td>
                  <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                    {p.transactionRef}
                  </td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)', maxWidth: '240px' }}>
                    {p.note}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Payment Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-card animate-fade-in" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '560px' }}>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '6px' }}>
              Record Payment
            </h3>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
              Reconcile incoming funds against an outstanding customer invoice.
            </p>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  Target Invoice
                </label>
                {unpaidInvoices.length === 0 ? (
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>No outstanding invoices available.</div>
                ) : (
                  <select
                    value={selectedInvoiceId}
                    onChange={(e) => handleInvoiceChange(e.target.value)}
                    className="neu-inset neu-input"
                  >
                    {unpaidInvoices.map((inv) => (
                      <option key={inv.id} value={inv.id}>
                        {inv.invoiceNumber} — {inv.customerName} (${inv.balance.toFixed(2)} due)
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                    Amount ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="neu-inset neu-input"
                  />
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
                    
                    <option value="Cash Settlement">Cash Settlement</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  Transaction / Wire Reference #
                </label>
                <input
                  type="text"
                  placeholder="e.g. WIRE-8921-BOA"
                  value={transactionRef}
                  onChange={(e) => setTransactionRef(e.target.value)}
                  className="neu-inset neu-input"
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  Payment Note
                </label>
                <input
                  type="text"
                  placeholder="e.g. Annual renewal wire settled"
                  value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                  className="neu-inset neu-input"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="neu-btn"
                  style={{ padding: '10px 18px', fontSize: '0.86rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={unpaidInvoices.length === 0}
                  className="neu-btn-primary"
                  style={{ padding: '10px 22px', fontSize: '0.86rem' }}
                >
                  Confirm & Post Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
