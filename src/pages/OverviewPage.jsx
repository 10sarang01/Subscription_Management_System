import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  DollarSign,
  Users,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  Zap,
  PlusCircle,
  CreditCard,
  Tag,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  FileText
} from 'lucide-react';
import { useSubscription } from '../context/SubscriptionContext';

export default function OverviewPage() {
  const {
    subscriptions,
    invoices,
    payments,
    runBillingDay,
    sendPaymentReminder
  } = useSubscription();

  const navigate = useNavigate();
  const [periodFilter, setPeriodFilter] = useState('month'); // 'month' | 'quarter' | 'year'

  // Calculations for Scene 7
  const activeSubs = subscriptions.filter((s) => s.status === 'Active');
  
  // Calculate MRR: normalize monthly and yearly plans
  const mrr = activeSubs.reduce((acc, sub) => {
    if (sub.billingFrequency === 'yearly') {
      return acc + (sub.totalAmount / 12);
    } else if (sub.billingFrequency === 'weekly') {
      return acc + (sub.totalAmount * 4.33);
    }
    return acc + sub.totalAmount;
  }, 0);

  const arr = mrr * 12;

  // Payments collected
  const totalCollected = payments.reduce((acc, p) => acc + p.amount, 0);

  // Invoices metrics
  const outstandingInvoices = invoices.filter((i) => i.status === 'Confirmed' || i.status === 'Overdue' || i.status === 'Partially Paid');
  const totalOutstanding = outstandingInvoices.reduce((acc, i) => acc + i.balance, 0);

  const overdueInvoices = invoices.filter((i) => i.status === 'Overdue');
  const totalOverdue = overdueInvoices.reduce((acc, i) => acc + i.balance, 0);

  // Subscription funnel counts
  const draftCount = subscriptions.filter((s) => s.status === 'Draft').length;
  const quoteCount = subscriptions.filter((s) => s.status === 'Quotation').length;
  const confirmedCount = subscriptions.filter((s) => s.status === 'Confirmed').length;
  const activeCount = activeSubs.length;
  const closedCount = subscriptions.filter((s) => s.status === 'Closed').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      
      {/* Top Banner: Finance Lead Quick Summary */}
      <div className="neu-flat" style={{ padding: '24px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Scene 7: Finance & Executive Monthly Close
          </span>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, marginTop: '4px', color: 'var(--text-main)' }}>
            Recurring Revenue & Health Summary
          </h2>
          <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Instant consolidated view answering: How many active subscriptions? Revenue collected? Receivables owed? Overdue accounts?
          </p>
        </div>

        {/* Period Filter Tabs */}
        <div className="neu-tabs" style={{ maxWidth: '320px' }}>
          <button
            className={`neu-tab ${periodFilter === 'month' ? 'active' : ''}`}
            onClick={() => setPeriodFilter('month')}
          >
            This Month
          </button>
          <button
            className={`neu-tab ${periodFilter === 'quarter' ? 'active' : ''}`}
            onClick={() => setPeriodFilter('quarter')}
          >
            Quarter
          </button>
          <button
            className={`neu-tab ${periodFilter === 'year' ? 'active' : ''}`}
            onClick={() => setPeriodFilter('year')}
          >
            Full Year
          </button>
        </div>
      </div>

      {/* KPI Metrics Grid */}
      <div className="metrics-grid">
        {/* MRR Card */}
        <div className="neu-flat metric-card">
          <div className="metric-header">
            <span>Monthly Recurring Revenue (MRR)</span>
            <div className="neu-flat-sm" style={{ width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="metric-value">
            ${mrr.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600 }}>/mo</span>
          </div>
          <div className="metric-trend" style={{ color: 'var(--success)' }}>
            <ArrowUpRight size={15} />
            <span>ARR Run Rate: ${(arr).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
          </div>
        </div>

        {/* Active Subscriptions Card */}
        <div className="neu-flat metric-card">
          <div className="metric-header">
            <span>Active Subscriptions</span>
            <div className="neu-flat-sm" style={{ width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284c7' }}>
              <Users size={18} />
            </div>
          </div>
          <div className="metric-value">{activeCount}</div>
          <div className="metric-trend" style={{ color: 'var(--text-muted)' }}>
            <span>{subscriptions.length} total contracts tracked</span>
          </div>
        </div>

        {/* Collected Revenue Card */}
        <div className="neu-flat metric-card">
          <div className="metric-header">
            <span>Collected Cash</span>
            <div className="neu-flat-sm" style={{ width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--success)' }}>
              <DollarSign size={18} />
            </div>
          </div>
          <div className="metric-value">
            ${totalCollected.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="metric-trend" style={{ color: 'var(--success)' }}>
            <CheckCircle2 size={15} />
            <span>{payments.length} transactions settled</span>
          </div>
        </div>

        {/* Outstanding Receivables Card */}
        <div className="neu-flat metric-card">
          <div className="metric-header">
            <span>Outstanding Invoices</span>
            <div className="neu-flat-sm" style={{ width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d97706' }}>
              <Clock size={18} />
            </div>
          </div>
          <div className="metric-value">
            ${totalOutstanding.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="metric-trend" style={{ color: '#d97706' }}>
            <span>{outstandingInvoices.length} invoices awaiting payment</span>
          </div>
        </div>

        {/* Overdue Alert Card */}
        <div className="neu-flat metric-card" style={{ borderLeft: '4px solid var(--error)' }}>
          <div className="metric-header">
            <span>Overdue At Risk</span>
            <div className="neu-flat-sm" style={{ width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--error)' }}>
              <AlertTriangle size={18} />
            </div>
          </div>
          <div className="metric-value" style={{ color: 'var(--error)' }}>
            ${totalOverdue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="metric-trend" style={{ color: 'var(--error)' }}>
            <span>{overdueInvoices.length} invoices overdue</span>
          </div>
        </div>
      </div>

      {/* Subscription Lifecycle Funnel: Scene 3 Requirement */}
      <div className="neu-flat" style={{ padding: '28px 30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>
              Subscription Lifecycle Stages
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Progress contracts seamlessly from quotation preparation to active recurring billing
            </p>
          </div>
          <button
            onClick={() => navigate('/quotes')}
            className="neu-btn"
            style={{ padding: '8px 16px', fontSize: '0.82rem' }}
          >
            Manage Subscriptions <ArrowRight size={14} />
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
          <div className="neu-inset-sm" style={{ padding: '16px', textAlign: 'center' }}>
            <span className="status-pill status-draft">1. Draft</span>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: '8px' }}>{draftCount}</div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Initial Proposals</span>
          </div>

          <div className="neu-inset-sm" style={{ padding: '16px', textAlign: 'center' }}>
            <span className="status-pill status-quotation">2. Quotation</span>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: '8px' }}>{quoteCount}</div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Dispatched to Client</span>
          </div>

          <div className="neu-inset-sm" style={{ padding: '16px', textAlign: 'center' }}>
            <span className="status-pill status-confirmed">3. Confirmed</span>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: '8px' }}>{confirmedCount}</div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Signed & Ready</span>
          </div>

          <div className="neu-inset-sm" style={{ padding: '16px', textAlign: 'center', border: '1px solid rgba(22, 163, 74, 0.3)' }}>
            <span className="status-pill status-active">4. Active</span>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: '8px', color: '#16a34a' }}>{activeCount}</div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Recurring Billing</span>
          </div>

          <div className="neu-inset-sm" style={{ padding: '16px', textAlign: 'center' }}>
            <span className="status-pill status-closed">5. Closed</span>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: '8px' }}>{closedCount}</div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Ended / Churned</span>
          </div>
        </div>
      </div>

      {/* Two Column Section: Overdue Invoices Aging & Quick Action Hub */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
        
        {/* Overdue Collections Widget (Scene 6) */}
        <div className="neu-flat" style={{ padding: '26px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={18} style={{ color: 'var(--error)' }} />
                Overdue Aging & Dunning
              </h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Chase overdue accounts before they turn into lost revenue
              </p>
            </div>
            <button
              onClick={() => navigate('/payments')}
              className="neu-btn"
              style={{ padding: '6px 12px', fontSize: '0.78rem' }}
            >
              View All
            </button>
          </div>

          {overdueInvoices.length === 0 ? (
            <div className="neu-inset-sm" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <CheckCircle2 size={32} style={{ color: 'var(--success)', margin: '0 auto 8px auto' }} />
              <div style={{ fontWeight: 700 }}>Zero Overdue Invoices</div>
              <p style={{ fontSize: '0.82rem' }}>All receivables are settled or within payment terms.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {overdueInvoices.map((inv) => (
                <div key={inv.id} className="neu-flat-sm" style={{ padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>{inv.customerName}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', gap: '8px' }}>
                      <span>{inv.invoiceNumber}</span>
                      <span>•</span>
                      <span style={{ color: 'var(--error)', fontWeight: 700 }}>
                        {inv.daysOverdue || 15} days overdue
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--error)' }}>
                      ${inv.balance.toFixed(2)}
                    </span>
                    <button
                      onClick={() => sendPaymentReminder(inv.id)}
                      className="neu-btn"
                      style={{ padding: '6px 12px', fontSize: '0.76rem', color: 'var(--primary)' }}
                      title="Send payment reminder email"
                    >
                      Chase Payment
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Launchpad & Workflows */}
        <div className="neu-flat" style={{ padding: '26px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Zap size={18} style={{ color: 'var(--primary)' }} />
              Quick Operational Workflows
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '2px', marginBottom: '18px' }}>
              Jump straight into common billing month scenarios
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
              <button
                onClick={() => navigate('/quotes')}
                className="neu-btn"
                style={{ padding: '14px', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left', gap: '6px' }}
              >
                <PlusCircle size={18} style={{ color: 'var(--primary)' }} />
                <span style={{ fontWeight: 700, fontSize: '0.86rem' }}>Create Quote</span>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>From templates</span>
              </button>

              <button
                onClick={() => runBillingDay()}
                className="neu-btn"
                style={{ padding: '14px', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left', gap: '6px' }}
              >
                <Zap size={18} style={{ color: '#d97706' }} />
                <span style={{ fontWeight: 700, fontSize: '0.86rem' }}>Run Billing Day</span>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Generate due invoices</span>
              </button>

              <button
                onClick={() => navigate('/payments')}
                className="neu-btn"
                style={{ padding: '14px', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left', gap: '6px' }}
              >
                <CreditCard size={18} style={{ color: 'var(--success)' }} />
                <span style={{ fontWeight: 700, fontSize: '0.86rem' }}>Record Payment</span>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Clear invoice balance</span>
              </button>

              <button
                onClick={() => navigate('/discounts')}
                className="neu-btn"
                style={{ padding: '14px', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left', gap: '6px' }}
              >
                <Tag size={18} style={{ color: '#7c3aed' }} />
                <span style={{ fontWeight: 700, fontSize: '0.86rem' }}>Add Discount</span>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Admin rule creator</span>
              </button>
            </div>
          </div>

          <div className="neu-inset-sm" style={{ padding: '12px 16px', marginTop: '16px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <ShieldCheck size={18} style={{ color: 'var(--primary)', flexShrink: 0 }} />
            <span>Brightloop guarantee: Nothing billed twice or skipped during automated billing runs.</span>
          </div>
        </div>

      </div>

    </div>
  );
}
