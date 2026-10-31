import React, { useState } from 'react';
import {
  FileText,
  Plus,
  ArrowRight,
  CheckCircle,
  Pause,
  Play,
  XCircle,
  RotateCw,
  Send,
  Zap,
  Tag,
  Building,
  Calendar,
  Layers,
  FileCheck,
  CheckCircle2,
  SlidersHorizontal,
  ChevronRight,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { useSubscription } from '../context/SubscriptionContext';

export default function SubscriptionsPage() {
  const {
    subscriptions,
    plans,
    products,
    discounts,
    quotationTemplates,
    createSubscription,
    updateSubscriptionStatus,
    runBillingDay,
    validateDiscount
  } = useSubscription();

  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedSub, setSelectedSub] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New Quote / Subscription state
  const [formCustomer, setFormCustomer] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPlanId, setFormPlanId] = useState(plans[0]?.id || 'plan-1');
  const [formPaymentTerms, setFormPaymentTerms] = useState('Net 30');
  const [formDiscountCode, setFormDiscountCode] = useState('');
  const [formItems, setFormItems] = useState([
    {
      productId: products[0]?.id || 'prod-1',
      name: products[0]?.name || 'Brightloop ERP Business Core',
      variant: 'Standard Edition',
      quantity: 1,
      unitPrice: 240,
      taxRate: 0.10
    }
  ]);

  // Filter subscriptions
  const filteredSubs = subscriptions.filter((s) => {
    if (statusFilter === 'ALL') return true;
    return s.status.toUpperCase() === statusFilter;
  });

  // Apply a template
  const applyTemplate = (template) => {
    const templatePlan = plans.find((p) => p.id === template.planId) || plans[0];
    setFormPlanId(templatePlan.id);
    const mappedItems = template.items.map((item) => {
      const prod = products.find((p) => p.id === item.productId);
      return {
        productId: item.productId,
        name: prod?.name || 'Software Product',
        variant: item.variant || 'Standard',
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        taxRate: 0.10
      };
    });
    setFormItems(mappedItems);
    setShowCreateModal(true);
  };

  const addItemRow = () => {
    const defaultProd = products[0] || { id: 'custom', name: 'Software Item', salesPrice: 100, variants: [] };
    setFormItems([
      ...formItems,
      {
        productId: defaultProd.id,
        name: defaultProd.name,
        variant: defaultProd.variants?.[0]?.name || 'Standard Edition',
        quantity: 1,
        unitPrice: defaultProd.salesPrice,
        taxRate: 0.10
      }
    ]);
  };

  const updateItemRow = (index, field, value) => {
    const updated = [...formItems];
    if (field === 'productId') {
      const prod = products.find((p) => p.id === value);
      updated[index].productId = value;
      updated[index].name = prod.name;
      updated[index].unitPrice = prod.salesPrice;
      updated[index].variant = prod.variants?.[0]?.name || 'Standard';
    } else if (field === 'variant') {
      const prod = products.find((p) => p.id === updated[index].productId);
      const variantObj = prod?.variants?.find((v) => v.name === value);
      const basePrice = prod?.salesPrice || 0;
      const offset = variantObj?.priceOffset || 0;
      updated[index].variant = value;
      updated[index].unitPrice = basePrice + offset;
    } else if (field === 'quantity') {
      updated[index].quantity = value === '' ? '' : Math.max(0, parseInt(value, 10) || 0);
    } else {
      updated[index][field] = value === '' ? '' : parseFloat(value) || 0;
    }
    setFormItems(updated);
  };

  const removeItemRow = (index) => {
    if (formItems.length <= 1) return;
    setFormItems(formItems.filter((_, i) => i !== index));
  };

  // Seat and Subtotal Metrics (Scene 5)
  const totalFormSeats = formItems.reduce((acc, item) => acc + (parseInt(item.quantity, 10) || 0), 0);
  const formSubtotal = formItems.reduce((acc, item) => acc + ((parseInt(item.quantity, 10) || 0) * (parseFloat(item.unitPrice) || 0)), 0);

  // Live discount validation for Quote modal
  const discountValidation = validateDiscount({
    code: formDiscountCode,
    items: formItems,
    subtotal: formSubtotal,
    date: new Date().toISOString().split('T')[0]
  });

  const calculateFormFinancials = () => {
    const subtotal = formSubtotal;
    const discountDeduction = discountValidation.valid ? discountValidation.deduction : 0;
    const discountedSubtotal = Math.max(0, subtotal - discountDeduction);
    const taxes = discountedSubtotal * 0.10;
    const grandTotal = Math.max(0, discountedSubtotal + taxes);
    return {
      subtotal,
      discountDeduction,
      discountedSubtotal,
      taxes,
      grandTotal
    };
  };

  const calculateFormTotal = () => {
    return calculateFormFinancials().grandTotal;
  };

  // 1-Click Volume deal seat qualification for sales negotiations (Scene 5)
  const autoBumpSeatsToQualify = (targetQuantity) => {
    if (!targetQuantity || formItems.length === 0) return;
    const otherSeats = formItems.slice(1).reduce((sum, it) => sum + (parseInt(it.quantity, 10) || 0), 0);
    const needed = Math.max(1, targetQuantity - otherSeats);
    updateItemRow(0, 'quantity', needed);
  };

  const handleCreateSubmit = (e, initialStatus = 'Draft') => {
    e.preventDefault();
    const selectedPlanObj = plans.find((p) => p.id === formPlanId) || plans[0];
    const financials = calculateFormFinancials();

    const created = createSubscription({
      customerName: formCustomer,
      customerEmail: formEmail,
      planId: selectedPlanObj.id,
      planName: selectedPlanObj.name,
      billingFrequency: selectedPlanObj.frequency,
      startDate: new Date().toISOString().split('T')[0],
      expiryDate: new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
      nextBillingDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      paymentTerms: formPaymentTerms,
      status: initialStatus, // Draft or Quotation
      discountCode: formDiscountCode.trim() ? formDiscountCode.trim().toUpperCase() : '',
      items: formItems,
      totalAmount: financials.grandTotal
    });

    setShowCreateModal(false);
    setSelectedSub(created);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Draft':
        return <span className="status-pill status-draft">Draft</span>;
      case 'Quotation':
        return <span className="status-pill status-quotation">Quotation</span>;
      case 'Confirmed':
        return <span className="status-pill status-confirmed">Confirmed</span>;
      case 'Active':
        return <span className="status-pill status-active">Active</span>;
      case 'Paused':
        return <span className="status-pill status-paused">Paused</span>;
      default:
        return <span className="status-pill status-closed">{status}</span>;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      
      {/* Top Banner */}
      <div className="neu-flat" style={{ padding: '24px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Scene 3: Quotation & Subscription Lifecycle
          </span>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, marginTop: '4px', color: 'var(--text-main)' }}>
            Quotes, Contracts & Lifecycle Transitions
          </h2>
          <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Progress from Quotation Template ➔ Draft ➔ Quotation ➔ Confirmed ➔ Active ➔ Closed.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="neu-btn-primary"
          style={{ padding: '10px 20px', fontSize: '0.86rem' }}
        >
          <Plus size={16} /> New Quote / Subscription
        </button>
      </div>

      {/* Quotation Templates Quick Launcher */}
      <div className="neu-flat" style={{ padding: '20px 26px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>
          <Layers size={16} style={{ color: 'var(--primary)' }} />
          <span>Quick Quotation Templates (1-Click Sales Rep Builder):</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
          {quotationTemplates.map((tmpl) => (
            <div
              key={tmpl.id}
              onClick={() => applyTemplate(tmpl)}
              className="neu-flat-sm"
              style={{ padding: '14px 18px', cursor: 'pointer', transition: 'all 0.15s ease', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.88rem' }}>{tmpl.name}</div>
                <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Valid for {tmpl.validityDays} days • {tmpl.items.length} pre-configured line items
                </div>
              </div>
              <ChevronRight size={16} style={{ color: 'var(--primary)' }} />
            </div>
          ))}
        </div>
      </div>

      {/* Main Table Card */}
      <div className="neu-flat" style={{ padding: '28px 30px' }}>
        
        {/* Table Filters */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', marginBottom: '20px' }}>
          <div className="neu-tabs" style={{ maxWidth: '600px', flexWrap: 'wrap' }}>
            {['ALL', 'DRAFT', 'QUOTATION', 'CONFIRMED', 'ACTIVE', 'CLOSED'].map((st) => (
              <button
                key={st}
                className={`neu-tab ${statusFilter === st ? 'active' : ''}`}
                onClick={() => setStatusFilter(st)}
                style={{ fontSize: '0.78rem', padding: '6px 12px' }}
              >
                {st}
              </button>
            ))}
          </div>

          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            Showing {filteredSubs.length} of {subscriptions.length} records
          </div>
        </div>

        {/* Subscriptions Table */}
        <div className="table-container">
          <table className="neu-table">
            <thead>
              <tr>
                <th>Contract #</th>
                <th>Customer</th>
                <th>Plan & Frequency</th>
                <th>Billing Terms</th>
                <th>Valid Dates</th>
                <th>Total / Cycle</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredSubs.map((sub) => (
                <tr key={sub.id} className="table-row">
                  <td style={{ fontWeight: 800, color: 'var(--primary)' }}>
                    {sub.subNumber}
                  </td>
                  <td>
                    <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>{sub.customerName}</div>
                    <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>{sub.customerEmail}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{sub.planName}</div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                      Billed {sub.billingFrequency}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.84rem', color: 'var(--text-main)', fontWeight: 600 }}>
                    {sub.paymentTerms}
                  </td>
                  <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    <div>From: {sub.startDate}</div>
                    <div>Until: {sub.expiryDate}</div>
                  </td>
                  <td style={{ fontWeight: 800, fontSize: '0.96rem' }}>
                    ${sub.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td>
                    {getStatusBadge(sub.status)}
                  </td>
                  <td>
                    <button
                      onClick={() => setSelectedSub(sub)}
                      className="neu-btn"
                      style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                    >
                      Inspect & Actions
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Subscription Inspector / Lifecycle Actions Modal */}
      {selectedSub && (
        <div className="modal-overlay" onClick={() => setSelectedSub(null)}>
          <div className="modal-card animate-fade-in" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '780px' }}>
            
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(184, 194, 204, 0.3)', paddingBottom: '16px', marginBottom: '20px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <h3 style={{ fontSize: '1.4rem', fontWeight: 800 }}>
                    {selectedSub.subNumber}
                  </h3>
                  {getStatusBadge(selectedSub.status)}
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Customer: <strong>{selectedSub.customerName}</strong> ({selectedSub.customerEmail})
                </p>
              </div>

              <button onClick={() => setSelectedSub(null)} className="neu-btn" style={{ padding: '6px 12px' }}>
                ✕
              </button>
            </div>

            {/* Lifecycle State Transitions Action Bar */}
            <div className="neu-inset-sm" style={{ padding: '16px 20px', marginBottom: '24px' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '10px' }}>
                Stage Progression & Lifecycle Controls
              </div>

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {selectedSub.status === 'Draft' && (
                  <button
                    onClick={() => {
                      updateSubscriptionStatus(selectedSub.id, 'Quotation');
                      setSelectedSub({ ...selectedSub, status: 'Quotation' });
                    }}
                    className="neu-btn-primary"
                    style={{ padding: '8px 16px', fontSize: '0.82rem' }}
                  >
                    <Send size={14} /> Send Quotation to Customer (➔ Quotation)
                  </button>
                )}

                {selectedSub.status === 'Quotation' && (
                  <>
                    <button
                      onClick={() => {
                        updateSubscriptionStatus(selectedSub.id, 'Confirmed');
                        setSelectedSub({ ...selectedSub, status: 'Confirmed' });
                      }}
                      className="neu-btn-primary"
                      style={{ padding: '8px 16px', fontSize: '0.82rem' }}
                    >
                      <CheckCircle size={14} /> Customer Accepted (➔ Confirmed)
                    </button>
                    <button
                      onClick={() => {
                        updateSubscriptionStatus(selectedSub.id, 'Closed');
                        setSelectedSub({ ...selectedSub, status: 'Closed' });
                      }}
                      className="neu-btn"
                      style={{ padding: '8px 14px', fontSize: '0.82rem', color: 'var(--error)' }}
                    >
                      <XCircle size={14} /> Reject / Decline
                    </button>
                  </>
                )}

                {selectedSub.status === 'Confirmed' && (
                  <button
                    onClick={() => {
                      updateSubscriptionStatus(selectedSub.id, 'Active');
                      setSelectedSub({ ...selectedSub, status: 'Active' });
                    }}
                    className="neu-btn-primary"
                    style={{ padding: '8px 18px', fontSize: '0.82rem' }}
                  >
                    <Play size={14} /> Activate Subscription (➔ Active)
                  </button>
                )}

                {selectedSub.status === 'Active' && (
                  <>
                    <button
                      onClick={() => {
                        updateSubscriptionStatus(selectedSub.id, 'Paused');
                        setSelectedSub({ ...selectedSub, status: 'Paused' });
                      }}
                      className="neu-btn"
                      style={{ padding: '8px 14px', fontSize: '0.82rem', color: '#c2410c' }}
                    >
                      <Pause size={14} /> Pause Contract
                    </button>
                    <button
                      onClick={() => {
                        updateSubscriptionStatus(selectedSub.id, 'Closed');
                        setSelectedSub({ ...selectedSub, status: 'Closed' });
                      }}
                      className="neu-btn"
                      style={{ padding: '8px 14px', fontSize: '0.82rem', color: 'var(--error)' }}
                    >
                      <XCircle size={14} /> Close / Terminate Early
                    </button>
                    <button
                      onClick={() => runBillingDay()}
                      className="neu-btn-primary"
                      style={{ padding: '8px 14px', fontSize: '0.82rem' }}
                    >
                      <Zap size={14} /> Generate Invoice Now
                    </button>
                  </>
                )}

                {selectedSub.status === 'Paused' && (
                  <button
                    onClick={() => {
                      updateSubscriptionStatus(selectedSub.id, 'Active');
                      setSelectedSub({ ...selectedSub, status: 'Active' });
                    }}
                    className="neu-btn-primary"
                    style={{ padding: '8px 16px', fontSize: '0.82rem' }}
                  >
                    <Play size={14} /> Resume Subscription (➔ Active)
                  </button>
                )}

                {selectedSub.status === 'Closed' && (
                  <button
                    onClick={() => {
                      updateSubscriptionStatus(selectedSub.id, 'Quotation');
                      setSelectedSub({ ...selectedSub, status: 'Quotation' });
                    }}
                    className="neu-btn-primary"
                    style={{ padding: '8px 16px', fontSize: '0.82rem' }}
                  >
                    <RotateCw size={14} /> Renew as New Quotation
                  </button>
                )}
              </div>
            </div>

            {/* Line Items Table */}
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ fontSize: '0.98rem', fontWeight: 800, marginBottom: '10px' }}>
                Itemized Product & Variant Lines
              </h4>
              <div className="table-container">
                <table className="neu-table">
                  <thead>
                    <tr>
                      <th>Product & Variant</th>
                      <th>Qty</th>
                      <th>Unit Price</th>
                      <th>Tax</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedSub.items.map((item, i) => (
                      <tr key={i} className="table-row">
                        <td style={{ fontWeight: 700 }}>
                          {item.name}
                          {item.variant && (
                            <span style={{ fontSize: '0.78rem', color: 'var(--primary)', display: 'block' }}>
                              Edition: {item.variant}
                            </span>
                          )}
                        </td>
                        <td>{item.quantity}</td>
                        <td>${item.unitPrice.toFixed(2)}</td>
                        <td>{((item.taxRate || 0.10) * 100).toFixed(0)}%</td>
                        <td style={{ fontWeight: 800 }}>${(item.quantity * item.unitPrice).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Contract Financial Summary */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid rgba(184, 194, 204, 0.3)', paddingTop: '16px' }}>
              <div style={{ minWidth: '240px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.88rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                  <span>Payment Terms:</span>
                  <strong>{selectedSub.paymentTerms}</strong>
                </div>
                {selectedSub.discountCode && (() => {
                  const rule = discounts.find((d) => d.code === selectedSub.discountCode);
                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', padding: '6px 10px', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#15803d', fontWeight: 700 }}>
                        <span>Negotiated Discount:</span>
                        <span>{selectedSub.discountCode}</span>
                      </div>
                      <div style={{ fontSize: '0.74rem', color: '#166534' }}>
                        {rule ? `${rule.name} (${rule.type === 'percentage' ? `${rule.value}% off` : `$${rule.value} off`}) • Scope: ${rule.scope.replace('_', ' ')}` : 'Active on next recurring invoice'}
                      </div>
                    </div>
                  );
                })()}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: 800, marginTop: '4px' }}>
                  <span>Total / Cycle:</span>
                  <span>${selectedSub.totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Modal: New Quote / Subscription Builder */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-card animate-fade-in" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '820px' }}>
            <h3 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: '6px' }}>
              Create Quote or Subscription
            </h3>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
              Assemble customer, recurring plan, product lines with brand variants, and payment terms.
            </p>

            <form onSubmit={(e) => handleCreateSubmit(e, 'Draft')} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                    Customer / Company Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Acme Tech Solutions"
                    value={formCustomer}
                    onChange={(e) => setFormCustomer(e.target.value)}
                    className="neu-inset neu-input"
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                    Customer Email Address
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="billing@acme.com"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="neu-inset neu-input"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                    Billing Plan
                  </label>
                  <select
                    value={formPlanId}
                    onChange={(e) => setFormPlanId(e.target.value)}
                    className="neu-inset neu-input"
                  >
                    {plans.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} (${p.cost}/{p.frequency})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                    Payment Terms
                  </label>
                  <select
                    value={formPaymentTerms}
                    onChange={(e) => setFormPaymentTerms(e.target.value)}
                    className="neu-inset neu-input"
                  >
                    <option value="Net 15">Net 15</option>
                    <option value="Net 30">Net 30</option>
                    <option value="Net 60">Net 60</option>
                    <option value="Due upon receipt">Due upon receipt</option>
                  </select>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                      Discount / Coupon Deal (Scene 5)
                    </label>
                    <span style={{ fontSize: '0.74rem', color: 'var(--primary)', fontWeight: 700 }}>
                      Current Seats: {totalFormSeats}
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '8px' }}>
                    <select
                      value={formDiscountCode}
                      onChange={(e) => setFormDiscountCode(e.target.value)}
                      className="neu-inset neu-input"
                      style={{ fontSize: '0.82rem' }}
                    >
                      <option value="">-- Quick-Select Active Discount Rule --</option>
                      {discounts.filter((d) => d.isActive).map((d) => (
                        <option key={d.id} value={d.code}>
                          {d.code}: {d.name} ({d.type === 'percentage' ? `${d.value}% off` : `$${d.value} off`} • min {d.minQuantity} seat{d.minQuantity > 1 ? 's' : ''})
                        </option>
                      ))}
                    </select>

                    <input
                      type="text"
                      placeholder="Or enter coupon (e.g. SEATBOOST10)"
                      value={formDiscountCode}
                      onChange={(e) => setFormDiscountCode(e.target.value.toUpperCase())}
                      className="neu-inset neu-input"
                      style={{ fontSize: '0.82rem', textTransform: 'uppercase' }}
                    />
                  </div>

                  {/* Real-Time Live Validation Feedback Card */}
                  {formDiscountCode.trim() ? (
                    <div style={{ marginTop: '8px' }}>
                      {discountValidation.valid ? (
                        <div style={{
                          padding: '10px 14px',
                          borderRadius: '10px',
                          background: '#f0fdf4',
                          border: '1px solid #bbf7d0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '10px'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#15803d', fontSize: '0.82rem' }}>
                            <CheckCircle2 size={16} />
                            <div>
                              <strong>{discountValidation.rule.name}:</strong> applied! -${discountValidation.deduction.toFixed(2)} savings.
                              <span style={{ fontSize: '0.74rem', color: '#166534', marginLeft: '6px' }}>
                                (Scope: {discountValidation.rule.scope === 'specific_product' ? 'Specific Product' : 'Whole Subscription'})
                              </span>
                            </div>
                          </div>
                          <span style={{ fontSize: '0.76rem', fontWeight: 800, color: '#15803d', background: '#dcfce7', padding: '3px 8px', borderRadius: '6px' }}>
                            VALID RULE
                          </span>
                        </div>
                      ) : (
                        <div style={{
                          padding: '10px 14px',
                          borderRadius: '10px',
                          background: '#fffbeb',
                          border: '1px solid #fde68a',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: '10px'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#b45309', fontSize: '0.82rem' }}>
                            <AlertCircle size={16} />
                            <span>{discountValidation.message}</span>
                          </div>

                          {/* Scene 5 Volume Threshold helper button */}
                          {(!discountValidation.valid && (discountValidation.message?.includes('Volume threshold') || (discountValidation.rule?.minQuantity && totalFormSeats < discountValidation.rule.minQuantity))) && (
                            <button
                              type="button"
                              onClick={() => {
                                const target = discountValidation.rule?.minQuantity || 5;
                                autoBumpSeatsToQualify(target);
                              }}
                              className="neu-btn-primary"
                              style={{
                                padding: '8px 14px',
                                fontSize: '0.82rem',
                                fontWeight: 800,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                cursor: 'pointer'
                              }}
                            >
                              <Sparkles size={15} /> ⚡ 1-Click: Bump to {discountValidation.rule?.minQuantity || 5} Seats to Unlock Deal
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ marginTop: '6px', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                      💡 <em>Customer asks for a better price? Pick <strong>SEATBOOST10</strong> (3+ seats) or <strong>ENTERPRISE20</strong> (5+ seats) for instant volume savings.</em>
                    </div>
                  )}
                </div>
              </div>

              {/* Dynamic Line Items Section */}
              <div style={{ borderTop: '1px solid rgba(184, 194, 204, 0.3)', paddingTop: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <label style={{ fontSize: '0.86rem', fontWeight: 800 }}>
                    Line Items (Products, Variants & Quantities)
                  </label>
                  <button
                    type="button"
                    onClick={addItemRow}
                    className="neu-btn"
                    style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                  >
                    + Add Product Line
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {formItems.map((item, index) => {
                    const currentProd = products.find((p) => p.id === item.productId);
                    return (
                      <div key={index} style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr auto', gap: '8px', alignItems: 'center' }}>
                        <select
                          value={item.productId}
                          onChange={(e) => updateItemRow(index, 'productId', e.target.value)}
                          className="neu-inset neu-input"
                          style={{ padding: '8px 10px', fontSize: '0.82rem' }}
                        >
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))}
                        </select>

                        <select
                          value={item.variant}
                          onChange={(e) => updateItemRow(index, 'variant', e.target.value)}
                          className="neu-inset neu-input"
                          style={{ padding: '8px 10px', fontSize: '0.82rem' }}
                        >
                          {currentProd?.variants?.map((v, vi) => (
                            <option key={vi} value={v.name}>
                              {v.name} {v.priceOffset > 0 ? `(+$${v.priceOffset})` : ''}
                            </option>
                          ))}
                        </select>

                        <input
                          type="number"
                          min="1"
                          placeholder="Qty"
                          value={item.quantity}
                          onChange={(e) => updateItemRow(index, 'quantity', e.target.value)}
                          onBlur={() => {
                            if (item.quantity === '' || parseInt(item.quantity, 10) < 1) {
                              updateItemRow(index, 'quantity', 1);
                            }
                          }}
                          className="neu-inset neu-input"
                          style={{ padding: '8px 10px', fontSize: '0.82rem' }}
                        />

                        <div style={{ fontSize: '0.86rem', fontWeight: 700, paddingLeft: '8px' }}>
                          ${(((parseInt(item.quantity, 10) || 0) * (parseFloat(item.unitPrice) || 0))).toFixed(2)}
                        </div>

                        {formItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeItemRow(index)}
                            className="neu-btn"
                            style={{ padding: '8px', color: 'var(--error)' }}
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Detailed Financials Breakdown Display */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid rgba(184, 194, 204, 0.3)', paddingTop: '14px' }}>
                <div style={{ width: '320px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                    <span>Line Items Subtotal:</span>
                    <span>${calculateFormFinancials().subtotal.toFixed(2)}</span>
                  </div>

                  {calculateFormFinancials().discountDeduction > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', color: '#16a34a', fontWeight: 700 }}>
                      <span>Volume Discount ({formDiscountCode}):</span>
                      <span>-${calculateFormFinancials().discountDeduction.toFixed(2)}</span>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                    <span>Automated Taxes (10% VAT):</span>
                    <span>+${calculateFormFinancials().taxes.toFixed(2)}</span>
                  </div>

                  <div style={{ height: '1px', background: 'rgba(184, 194, 204, 0.4)', margin: '4px 0' }} />

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)' }}>
                    <span>Estimated Cycle Total:</span>
                    <span>${calculateFormFinancials().grandTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="neu-btn"
                  style={{ padding: '10px 18px', fontSize: '0.86rem' }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={(e) => handleCreateSubmit(e, 'Quotation')}
                  className="neu-btn"
                  style={{ padding: '10px 18px', fontSize: '0.86rem', color: 'var(--primary)' }}
                >
                  Save as Quotation
                </button>
                <button
                  type="submit"
                  className="neu-btn-primary"
                  style={{ padding: '10px 22px', fontSize: '0.86rem' }}
                >
                  Save as Draft
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
