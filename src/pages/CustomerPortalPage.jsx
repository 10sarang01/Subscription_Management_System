import React, { useState } from 'react';
import {
  Store,
  CreditCard,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowRight,
  ShieldCheck,
  Zap,
  Download,
  DollarSign,
  ToggleLeft,
  ToggleRight,
  Sparkles
} from 'lucide-react';
import { useSubscription } from '../context/SubscriptionContext';

export default function CustomerPortalPage() {
  const {
    currentPersona,
    subscriptions,
    invoices,
    products,
    recordPayment,
    showToast
  } = useSubscription();

  // Find customer subscriptions and invoices
  const customerEmail = currentPersona.email || '';
  const customerSubs = subscriptions.filter(
    (s) => (s.customerEmail || '').toLowerCase() === customerEmail.toLowerCase() || currentPersona.role === 'customer'
  );
  const activeSub = customerSubs.find((s) => s.status === 'Active') || customerSubs[0];

  const customerInvoices = invoices.filter(
    (i) => (i.customerEmail || '').toLowerCase() === customerEmail.toLowerCase() || currentPersona.role === 'customer'
  );

  // Self-service Add-ons toggles (Scene 2: "add-ons customers switch on and off")
  const [activeAddons, setActiveAddons] = useState({
    'prod-2': true, // Analytics AI Forecasting
    'prod-3': false // Cloud Database Storage
  });

  const toggleAddon = (prodId, prodName, price) => {
    const newState = !activeAddons[prodId];
    setActiveAddons((prev) => ({ ...prev, [prodId]: newState }));
    showToast(
      newState
        ? `Added ${prodName} (+₹${price}/mo) to next billing cycle!`
        : `Removed ${prodName} from future billing cycles.`,
      newState ? 'success' : 'info'
    );
  };

  const handlePayInvoice = () => {
    showToast('Online payments are not configured yet.', 'error');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      
      {/* Top Banner */}
      <div className="neu-flat" style={{ padding: '28px 32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="neu-pill pill-customer">Self-Service Portal</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>• Your account</span>
            </div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: '8px', color: 'var(--text-main)' }}>
              Welcome back, {currentPersona.full_name || currentPersona.name || currentPersona.email || 'there'}!
            </h2>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Account Entity: <strong>{currentPersona.company_name || currentPersona.company || '—'}</strong> • Self-service subscription management without having to email support.
            </p>
          </div>

          <div className="neu-flat-sm" style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a' }}>
              <ShieldCheck size={22} />
            </div>
            <div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Account Standing</div>
              <div style={{ fontSize: '0.94rem', fontWeight: 800, color: '#16a34a' }}>Active & Verified</div>
            </div>
          </div>
        </div>
      </div>

      {/* Active Subscription Overview Card */}
      {activeSub ? (
        <div className="neu-flat" style={{ padding: '28px 30px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
            <div>
              <span className="status-pill status-active">Currently Active</span>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 800, marginTop: '8px' }}>
                {activeSub.planName}
              </h3>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Subscription Reference: <strong>{activeSub.subNumber}</strong> • Terms: <strong>{activeSub.paymentTerms}</strong>
              </p>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary)' }}>
                ₹{activeSub.totalAmount.toFixed(2)}
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>/{activeSub.billingFrequency}</span>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Next Automated Billing: <strong>{activeSub.nextBillingDate}</strong>
              </div>
            </div>
          </div>

          {/* Subscribed Product Lines */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '10px' }}>
              Base Software & Licensed Seats
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
              {activeSub.items.map((item, idx) => (
                <div key={idx} className="neu-inset-sm" style={{ padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{item.name}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--primary)', marginTop: '2px' }}>
                      Edition: {item.variant || 'Standard'} • Quantity: {item.quantity} seat(s)
                    </div>
                  </div>
                  <div style={{ fontWeight: 800 }}>₹{(item.quantity * item.unitPrice).toFixed(2)}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Interactive Self-Service Add-ons Switcher (Scene 2 in Problem Statement) */}
          <div style={{ borderTop: '1px solid rgba(184, 194, 204, 0.3)', paddingTop: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <Sparkles size={16} style={{ color: 'var(--primary)' }} />
              <h4 style={{ fontSize: '1.05rem', fontWeight: 800 }}>
                Optional Add-ons (Switch On / Off Instantly)
              </h4>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Toggle enhancements anytime. Prorated amounts automatically adjust on your next recurring statement.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '14px' }}>
              <div className="neu-flat-sm" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>Advanced Analytics & AI Forecasting</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>+₹95.00 / month</div>
                </div>
                <button
                  onClick={() => toggleAddon('prod-2', 'Analytics AI Forecasting', 95)}
                  className="neu-btn"
                  style={{
                    padding: '8px 14px',
                    fontSize: '0.78rem',
                    color: activeAddons['prod-2'] ? '#16a34a' : 'var(--text-muted)',
                    fontWeight: 700
                  }}
                >
                  {activeAddons['prod-2'] ? '✓ Enabled' : '+ Add'}
                </button>
              </div>

              <div className="neu-flat-sm" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>High-Performance Cloud Database Storage</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>+₹65.00 / month</div>
                </div>
                <button
                  onClick={() => toggleAddon('prod-3', 'Cloud Database Storage', 65)}
                  className="neu-btn"
                  style={{
                    padding: '8px 14px',
                    fontSize: '0.78rem',
                    color: activeAddons['prod-3'] ? '#16a34a' : 'var(--text-muted)',
                    fontWeight: 700
                  }}
                >
                  {activeAddons['prod-3'] ? '✓ Enabled' : '+ Add'}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="neu-flat" style={{ padding: '30px', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)' }}>No active subscriptions found for this account.</p>
        </div>
      )}

      {/* Customer Invoices & Statements Table */}
      <div className="neu-flat" style={{ padding: '28px 30px' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '6px' }}>
          My Invoices & Billing Statements ({customerInvoices.length})
        </h3>
        <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
          View past invoices, check outstanding balances, and pay online instantly
        </p>

        <div className="table-container">
          <table className="neu-table">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Issue Date</th>
                <th>Due Date</th>
                <th>Amount</th>
                <th>Balance Due</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {customerInvoices.map((inv) => (
                <tr key={inv.id} className="table-row">
                  <td style={{ fontWeight: 800, color: 'var(--primary)' }}>
                    {inv.invoiceNumber}
                  </td>
                  <td style={{ fontSize: '0.84rem' }}>{inv.issueDate}</td>
                  <td style={{ fontSize: '0.84rem' }}>{inv.dueDate}</td>
                  <td style={{ fontWeight: 700 }}>₹{inv.total.toFixed(2)}</td>
                  <td style={{ fontWeight: 800, color: inv.balance > 0 ? 'var(--error)' : 'var(--success)' }}>
                    ₹{inv.balance.toFixed(2)}
                  </td>
                  <td>
                    <span className={`status-pill status-${inv.status.toLowerCase().replace(' ', '-')}`}>
                      {inv.status}
                    </span>
                  </td>
                  <td>
                    {inv.balance > 0 ? (
                      <button
                        onClick={() => handlePayInvoice(inv)}
                        className="neu-btn-primary"
                        style={{ padding: '6px 14px', fontSize: '0.78rem' }}
                      >
                        <CreditCard size={14} /> Pay Now (₹{inv.balance.toFixed(2)})
                      </button>
                    ) : (
                      <button
                        onClick={() => window.print()}
                        className="neu-btn"
                        style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                      >
                        <Download size={13} /> Receipt
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
