import React, { useState } from 'react';
import {
  Package,
  Layers,
  Plus,
  Calendar,
  Clock,
  Check,
  X,
  Sliders,
  DollarSign,
  Tag,
  Shield,
  HelpCircle,
  Sparkles
} from 'lucide-react';
import { useSubscription } from '../context/SubscriptionContext';

export default function ProductsPage() {
  const { products, plans, addProduct, addPlan, currentPersona } = useSubscription();

  const [activeTab, setActiveTab] = useState('products'); // 'products' | 'plans'
  const [showProductModal, setShowProductModal] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);

  // New Product Form State
  const [productForm, setProductForm] = useState({
    name: '',
    type: 'Software',
    salesPrice: '',
    costPrice: '',
    notes: '',
    variants: [{ name: 'Standard Edition', priceOffset: 0 }]
  });

  // New Plan Form State
  const [planForm, setPlanForm] = useState({
    name: '',
    cost: '',
    frequency: 'monthly',
    minQuantity: 1,
    startDate: new Date().toISOString().split('T')[0],
    endDate: '2026-12-31',
    autoCloseOnEnd: true,
    canCloseEarly: true,
    canPause: true,
    canRenew: true,
    description: ''
  });

  const isAdmin = currentPersona.role === 'admin';

  // Variant helper
  const addVariantRow = () => {
    setProductForm({
      ...productForm,
      variants: [...productForm.variants, { name: '', priceOffset: 0 }]
    });
  };

  const updateVariantRow = (index, field, value) => {
    const updated = [...productForm.variants];
    updated[index][field] = field === 'priceOffset' ? parseFloat(value) || 0 : value;
    setProductForm({ ...productForm, variants: updated });
  };

  const removeVariantRow = (index) => {
    if (productForm.variants.length <= 1) return;
    setProductForm({
      ...productForm,
      variants: productForm.variants.filter((_, i) => i !== index)
    });
  };

  const handleProductSubmit = (e) => {
    e.preventDefault();
    addProduct({
      name: productForm.name,
      type: productForm.type,
      salesPrice: parseFloat(productForm.salesPrice) || 0,
      costPrice: parseFloat(productForm.costPrice) || 0,
      notes: productForm.notes,
      variants: productForm.variants.filter(v => v.name.trim() !== '')
    });
    setProductForm({
      name: '',
      type: 'Software',
      salesPrice: '',
      costPrice: '',
      notes: '',
      variants: [{ name: 'Standard Edition', priceOffset: 0 }]
    });
    setShowProductModal(false);
  };

  const handlePlanSubmit = (e) => {
    e.preventDefault();
    addPlan({
      name: planForm.name,
      cost: parseFloat(planForm.cost) || 0,
      frequency: planForm.frequency,
      minQuantity: parseInt(planForm.minQuantity) || 1,
      startDate: planForm.startDate,
      endDate: planForm.endDate,
      autoCloseOnEnd: planForm.autoCloseOnEnd,
      canCloseEarly: planForm.canCloseEarly,
      canPause: planForm.canPause,
      canRenew: planForm.canRenew,
      description: planForm.description
    });
    setPlanForm({
      name: '',
      cost: '',
      frequency: 'monthly',
      minQuantity: 1,
      startDate: new Date().toISOString().split('T')[0],
      endDate: '2026-12-31',
      autoCloseOnEnd: true,
      canCloseEarly: true,
      canPause: true,
      canRenew: true,
      description: ''
    });
    setShowPlanModal(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      
      {/* Top Banner */}
      <div className="neu-flat" style={{ padding: '24px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Scene 2: Product & Plan Architecture
          </span>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, marginTop: '4px', color: 'var(--text-main)' }}>
            Products, Variants & Lifecycle Rules
          </h2>
          <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Configure recurring software items, variant price modifiers (e.g., Odoo Brand), and billing frequencies (daily, weekly, monthly, yearly).
          </p>
        </div>

        {/* Tab Toggle & Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <div className="neu-tabs" style={{ minWidth: '240px' }}>
            <button
              className={`neu-tab ${activeTab === 'products' ? 'active' : ''}`}
              onClick={() => setActiveTab('products')}
            >
              Products ({products.length})
            </button>
            <button
              className={`neu-tab ${activeTab === 'plans' ? 'active' : ''}`}
              onClick={() => setActiveTab('plans')}
            >
              Plans ({plans.length})
            </button>
          </div>

          {isAdmin ? (
            activeTab === 'products' ? (
              <button
                onClick={() => setShowProductModal(true)}
                className="neu-btn-primary"
                style={{ padding: '10px 18px', fontSize: '0.86rem' }}
              >
                <Plus size={16} /> New Product
              </button>
            ) : (
              <button
                onClick={() => setShowPlanModal(true)}
                className="neu-btn-primary"
                style={{ padding: '10px 18px', fontSize: '0.86rem' }}
              >
                <Plus size={16} /> New Plan
              </button>
            )
          ) : (
            <div className="neu-inset-sm" style={{ padding: '8px 14px', fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Shield size={14} style={{ color: 'var(--primary)' }} />
              Admin role required to publish new catalog items
            </div>
          )}
        </div>
      </div>

      {/* Products Tab View */}
      {activeTab === 'products' && (
        <div className="neu-flat" style={{ padding: '28px 30px' }}>
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Available Products & Add-ons</h3>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Each product includes cost, sales price, gross margins, and brand variants.
            </p>
          </div>

          <div className="table-container">
            <table className="neu-table">
              <thead>
                <tr>
                  <th>Product Details</th>
                  <th>Type</th>
                  <th>Base Sales Price</th>
                  <th>Cost Price</th>
                  <th>Margin</th>
                  <th>Variants & Brand Modifiers</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => {
                  const margin = p.salesPrice > 0 ? (((p.salesPrice - p.costPrice) / p.salesPrice) * 100).toFixed(0) : 0;
                  return (
                    <tr key={p.id} className="table-row">
                      <td>
                        <div style={{ fontWeight: 800, fontSize: '0.94rem' }}>{p.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID: {p.id}</div>
                      </td>
                      <td>
                        <span className="status-pill status-confirmed">
                          {p.type}
                        </span>
                      </td>
                      <td style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-main)' }}>
                        ${p.salesPrice.toFixed(2)}
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                        ${p.costPrice.toFixed(2)}
                      </td>
                      <td>
                        <span style={{ fontWeight: 700, color: 'var(--success)', fontSize: '0.86rem' }}>
                          +{margin}%
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                          {p.variants && p.variants.map((v, i) => (
                            <span
                              key={i}
                              className="neu-inset-sm"
                              style={{
                                padding: '4px 8px',
                                fontSize: '0.76rem',
                                fontWeight: 600,
                                color: v.priceOffset > 0 ? 'var(--primary)' : 'var(--text-main)'
                              }}
                            >
                              {v.name} {v.priceOffset > 0 ? `(+$${v.priceOffset})` : ''}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)', maxWidth: '240px' }}>
                        {p.notes || '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Plans Tab View */}
      {activeTab === 'plans' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="neu-flat" style={{ padding: '28px 30px' }}>
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Recurring Billing Plans</h3>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Defined billing frequency, minimum seat quantities, dates available, and automated lifecycle policies.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
              {plans.map((plan) => (
                <div key={plan.id} className="neu-flat-sm" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '16px' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <h4 style={{ fontSize: '1.1rem', fontWeight: 800 }}>{plan.name}</h4>
                      <span className="status-pill status-active" style={{ textTransform: 'capitalize' }}>
                        {plan.frequency}
                      </span>
                    </div>

                    <div style={{ fontSize: '1.7rem', fontWeight: 800, marginTop: '10px', color: 'var(--primary)' }}>
                      ${plan.cost}
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                        /{plan.frequency === 'daily' ? 'day' : plan.frequency === 'weekly' ? 'wk' : plan.frequency === 'monthly' ? 'mo' : 'yr'}
                      </span>
                    </div>

                    <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                      {plan.description}
                    </p>

                    <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      <div>Min Quantity: <strong>{plan.minQuantity} seat(s)</strong></div>
                      <div>Validity: <strong>{plan.startDate}</strong> to <strong>{plan.endDate}</strong></div>
                    </div>
                  </div>

                  {/* Lifecycle Rules Checkbox Badges */}
                  <div style={{ borderTop: '1px solid rgba(184, 194, 204, 0.3)', paddingTop: '14px' }}>
                    <div style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
                      Lifecycle Policy (Admin Rules)
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px', fontSize: '0.76rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: plan.autoCloseOnEnd ? '#16a34a' : 'var(--text-muted)' }}>
                        {plan.autoCloseOnEnd ? <Check size={14} color="#16a34a" /> : <X size={14} />}
                        Auto-close on end
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: plan.canCloseEarly ? '#16a34a' : 'var(--text-muted)' }}>
                        {plan.canCloseEarly ? <Check size={14} color="#16a34a" /> : <X size={14} />}
                        Closable early
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: plan.canPause ? '#16a34a' : 'var(--text-muted)' }}>
                        {plan.canPause ? <Check size={14} color="#16a34a" /> : <X size={14} />}
                        Pausable
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: plan.canRenew ? '#16a34a' : 'var(--text-muted)' }}>
                        {plan.canRenew ? <Check size={14} color="#16a34a" /> : <X size={14} />}
                        Renewable
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal: New Product */}
      {showProductModal && (
        <div className="modal-overlay" onClick={() => setShowProductModal(false)}>
          <div className="modal-card animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '6px' }}>
              Launch New Product
            </h3>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
              Add product specifications, base pricing, and brand variant price modifiers.
            </p>

            <form onSubmit={handleProductSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  Product Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Odoo Integration Connector"
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  className="neu-inset neu-input"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                    Type
                  </label>
                  <select
                    value={productForm.type}
                    onChange={(e) => setProductForm({ ...productForm, type: e.target.value })}
                    className="neu-inset neu-input"
                  >
                    <option value="Software">Software</option>
                    <option value="Add-on">Add-on</option>
                    <option value="Service">Service</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                    Sales Price ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="240.00"
                    value={productForm.salesPrice}
                    onChange={(e) => setProductForm({ ...productForm, salesPrice: e.target.value })}
                    className="neu-inset neu-input"
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                    Cost Price ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="85.00"
                    value={productForm.costPrice}
                    onChange={(e) => setProductForm({ ...productForm, costPrice: e.target.value })}
                    className="neu-inset neu-input"
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  Product Notes / Description
                </label>
                <textarea
                  rows="2"
                  placeholder="Internal notes and licensing details..."
                  value={productForm.notes}
                  onChange={(e) => setProductForm({ ...productForm, notes: e.target.value })}
                  className="neu-inset neu-input"
                  style={{ resize: 'none' }}
                />
              </div>

              {/* Dynamic Variants & Modifiers */}
              <div style={{ borderTop: '1px solid rgba(184, 194, 204, 0.3)', paddingTop: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    Product Variants (e.g., Odoo Brand adds $60)
                  </label>
                  <button
                    type="button"
                    onClick={addVariantRow}
                    className="neu-btn"
                    style={{ padding: '4px 10px', fontSize: '0.74rem' }}
                  >
                    + Add Variant
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {productForm.variants.map((v, i) => (
                    <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr auto', gap: '8px', alignItems: 'center' }}>
                      <input
                        type="text"
                        placeholder="Variant Name (e.g. Odoo Brand)"
                        value={v.name}
                        onChange={(e) => updateVariantRow(i, 'name', e.target.value)}
                        className="neu-inset neu-input"
                        style={{ padding: '8px 12px', fontSize: '0.82rem' }}
                      />
                      <input
                        type="number"
                        placeholder="Price Offset (+$)"
                        value={v.priceOffset}
                        onChange={(e) => updateVariantRow(i, 'priceOffset', e.target.value)}
                        className="neu-inset neu-input"
                        style={{ padding: '8px 12px', fontSize: '0.82rem' }}
                      />
                      {productForm.variants.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeVariantRow(i)}
                          className="neu-btn"
                          style={{ padding: '8px', color: 'var(--error)' }}
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
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
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: New Plan */}
      {showPlanModal && (
        <div className="modal-overlay" onClick={() => setShowPlanModal(false)}>
          <div className="modal-card animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '6px' }}>
              Launch New Billing Plan
            </h3>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
              Configure billing schedule, dates, and autonomous lifecycle rules.
            </p>

            <form onSubmit={handlePlanSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  Plan Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Enterprise Quarterly Tier"
                  value={planForm.name}
                  onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                  className="neu-inset neu-input"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                    Cost ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="250.00"
                    value={planForm.cost}
                    onChange={(e) => setPlanForm({ ...planForm, cost: e.target.value })}
                    className="neu-inset neu-input"
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                    Frequency
                  </label>
                  <select
                    value={planForm.frequency}
                    onChange={(e) => setPlanForm({ ...planForm, frequency: e.target.value })}
                    className="neu-inset neu-input"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                    Min Quantity
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={planForm.minQuantity}
                    onChange={(e) => setPlanForm({ ...planForm, minQuantity: e.target.value })}
                    className="neu-inset neu-input"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                    Start Date
                  </label>
                  <input
                    type="date"
                    required
                    value={planForm.startDate}
                    onChange={(e) => setPlanForm({ ...planForm, startDate: e.target.value })}
                    className="neu-inset neu-input"
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                    End Date
                  </label>
                  <input
                    type="date"
                    required
                    value={planForm.endDate}
                    onChange={(e) => setPlanForm({ ...planForm, endDate: e.target.value })}
                    className="neu-inset neu-input"
                  />
                </div>
              </div>

              {/* Lifecycle Rules Checkbox Grid */}
              <div style={{ borderTop: '1px solid rgba(184, 194, 204, 0.3)', paddingTop: '14px' }}>
                <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '10px' }}>
                  Lifecycle Policies (Plan by Plan Control)
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', fontSize: '0.84rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={planForm.autoCloseOnEnd}
                      onChange={(e) => setPlanForm({ ...planForm, autoCloseOnEnd: e.target.checked })}
                      style={{ accentColor: 'var(--primary)', width: '16px', height: '16px' }}
                    />
                    Auto-close on end
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={planForm.canCloseEarly}
                      onChange={(e) => setPlanForm({ ...planForm, canCloseEarly: e.target.checked })}
                      style={{ accentColor: 'var(--primary)', width: '16px', height: '16px' }}
                    />
                    Closable early
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={planForm.canPause}
                      onChange={(e) => setPlanForm({ ...planForm, canPause: e.target.checked })}
                      style={{ accentColor: 'var(--primary)', width: '16px', height: '16px' }}
                    />
                    Pausable
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={planForm.canRenew}
                      onChange={(e) => setPlanForm({ ...planForm, canRenew: e.target.checked })}
                      style={{ accentColor: 'var(--primary)', width: '16px', height: '16px' }}
                    />
                    Renewable
                  </label>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowPlanModal(false)}
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
                  Save Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
