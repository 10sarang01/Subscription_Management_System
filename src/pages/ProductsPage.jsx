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
  Trash2,
  Database,
  ArrowRight
} from 'lucide-react';
import { useSubscription } from '../context/SubscriptionContext';

export default function ProductsPage() {
  const { products, plans, addProduct, deleteProduct, addPlan, deletePlan, currentPersona } = useSubscription();

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
    hasOdooBrand: true, // Problem statement business rule: choosing Odoo brand adds 560
    odooPriceOffset: 560,
    customVariants: []
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

  // Custom Variant helper
  const addCustomVariant = () => {
    setProductForm({
      ...productForm,
      customVariants: [...productForm.customVariants, { name: '', priceOffset: 0 }]
    });
  };

  const updateCustomVariant = (index, field, value) => {
    const updated = [...productForm.customVariants];
    updated[index][field] = field === 'priceOffset' ? parseFloat(value) || 0 : value;
    setProductForm({ ...productForm, customVariants: updated });
  };

  const removeCustomVariant = (index) => {
    setProductForm({
      ...productForm,
      customVariants: productForm.customVariants.filter((_, i) => i !== index)
    });
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    
    // Assemble variants based on business rules
    const assembledVariants = [
      { name: 'Standard Edition', priceOffset: 0 }
    ];

    if (productForm.hasOdooBrand) {
      assembledVariants.push({
        name: 'Odoo Brand Edition',
        priceOffset: parseFloat(productForm.odooPriceOffset) || 560
      });
    }

    // Add any custom variants
    productForm.customVariants.forEach((cv) => {
      if (cv.name.trim() !== '') {
        assembledVariants.push({
          name: cv.name.trim(),
          priceOffset: parseFloat(cv.priceOffset) || 0
        });
      }
    });

    await addProduct({
      name: productForm.name,
      type: productForm.type,
      salesPrice: parseFloat(productForm.salesPrice) || 0,
      costPrice: parseFloat(productForm.costPrice) || 0,
      notes: productForm.notes,
      hasOdooVariant: productForm.hasOdooBrand,
      odooPriceOffset: parseFloat(productForm.odooPriceOffset) || 560,
      variants: assembledVariants
    });

    setProductForm({
      name: '',
      type: 'Software',
      salesPrice: '',
      costPrice: '',
      notes: '',
      hasOdooBrand: true,
      odooPriceOffset: 560,
      customVariants: []
    });
    setShowProductModal(false);
  };

  const handlePlanSubmit = async (e) => {
    e.preventDefault();
    await addPlan({
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Scene 2: Launching a New Plan
            </span>
            <span style={{
              fontSize: '0.72rem',
              padding: '2px 8px',
              borderRadius: '999px',
              background: '#dcfce7',
              color: '#15803d',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <Database size={12} /> SQLite Live Database
            </span>
          </div>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, marginTop: '4px', color: 'var(--text-main)' }}>
            Products, Variants & Recurring Plans
          </h2>
          <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Add software products with cost/sales prices, notes, and brand variants (e.g. <strong>Odoo Brand adds $560</strong>). Configure plan billing frequencies and lifecycle rules.
          </p>
        </div>

        {/* Tab Toggle & Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <div className="neu-tabs" style={{ minWidth: '240px' }}>
            <button
              className={`neu-tab ${activeTab === 'products' ? 'active' : ''}`}
              onClick={() => setActiveTab('products')}
            >
              Live Products ({products.length})
            </button>
            <button
              className={`neu-tab ${activeTab === 'plans' ? 'active' : ''}`}
              onClick={() => setActiveTab('plans')}
            >
              Live Plans ({plans.length})
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Live Products & Add-ons Catalog</h3>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                All records stored in SQLite database (<code>users.db</code> • table: <code>products</code>)
              </p>
            </div>
            {products.length > 0 && isAdmin && (
              <button
                onClick={() => setShowProductModal(true)}
                className="neu-btn-primary"
                style={{ padding: '8px 16px', fontSize: '0.82rem' }}
              >
                + Add Another Product
              </button>
            )}
          </div>

          {products.length === 0 ? (
            <div className="neu-inset-sm" style={{ padding: '48px 24px', textAlign: 'center', borderRadius: '16px' }}>
              <div className="neu-flat-sm" style={{ width: '56px', height: '56px', borderRadius: '50%', margin: '0 auto 16px auto', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                <Package size={28} />
              </div>
              <h4 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>No Products Created Yet</h4>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', maxWidth: '460px', margin: '8px auto 20px auto', lineHeight: 1.5 }}>
                Dummy data has been cleared. Add your first live product with base pricing, cost price, and the <strong>Odoo Brand variant</strong> (adds $560).
              </p>
              {isAdmin && (
                <button
                  onClick={() => setShowProductModal(true)}
                  className="neu-btn-primary"
                  style={{ padding: '12px 24px', fontSize: '0.92rem' }}
                >
                  <Plus size={18} /> Launch First Product
                </button>
              )}
            </div>
          ) : (
            <div className="table-container">
              <table className="neu-table">
                <thead>
                  <tr>
                    <th>Product Name</th>
                    <th>Type</th>
                    <th>Base Sales Price</th>
                    <th>Cost Price</th>
                    <th>Margin</th>
                    <th>Variants & Brand Modifiers</th>
                    <th>Notes</th>
                    {isAdmin && <th>Action</th>}
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => {
                    const margin = p.salesPrice > 0 ? (((p.salesPrice - p.costPrice) / p.salesPrice) * 100).toFixed(0) : 0;
                    return (
                      <tr key={p.id} className="table-row">
                        <td>
                          <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>{p.name}</div>
                          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>ID: {p.id}</div>
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
                            {p.variants && p.variants.map((v, i) => {
                              const isOdoo = v.name.toLowerCase().includes('odoo');
                              return (
                                <span
                                  key={i}
                                  className="neu-inset-sm"
                                  style={{
                                    padding: '4px 10px',
                                    fontSize: '0.78rem',
                                    fontWeight: 700,
                                    borderRadius: '8px',
                                    color: isOdoo ? '#5b21b6' : 'var(--text-main)',
                                    background: isOdoo ? '#ede9fe' : 'var(--bg-color)',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                  }}
                                >
                                  {isOdoo && <span>👑</span>}
                                  <span>{v.name}</span>
                                  {v.priceOffset > 0 && (
                                    <strong style={{ color: isOdoo ? '#5b21b6' : 'var(--primary)' }}>
                                      (+${v.priceOffset})
                                    </strong>
                                  )}
                                </span>
                              );
                            })}
                          </div>
                        </td>
                        <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)', maxWidth: '240px' }}>
                          {p.notes || '—'}
                        </td>
                        {isAdmin && (
                          <td>
                            <button
                              onClick={() => deleteProduct(p.id)}
                              className="neu-btn"
                              style={{ padding: '6px 10px', color: 'var(--error)' }}
                              title="Delete product"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Plans Tab View */}
      {activeTab === 'plans' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="neu-flat" style={{ padding: '28px 30px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Recurring Billing Plans</h3>
                <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  All plans persisted in SQLite database (<code>users.db</code> • table: <code>plans</code>)
                </p>
              </div>
              {plans.length > 0 && isAdmin && (
                <button
                  onClick={() => setShowPlanModal(true)}
                  className="neu-btn-primary"
                  style={{ padding: '8px 16px', fontSize: '0.82rem' }}
                >
                  + Add Another Plan
                </button>
              )}
            </div>

            {plans.length === 0 ? (
              <div className="neu-inset-sm" style={{ padding: '48px 24px', textAlign: 'center', borderRadius: '16px' }}>
                <div className="neu-flat-sm" style={{ width: '56px', height: '56px', borderRadius: '50%', margin: '0 auto 16px auto', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                  <Calendar size={28} />
                </div>
                <h4 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>No Billing Plans Created Yet</h4>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', maxWidth: '460px', margin: '8px auto 20px auto', lineHeight: 1.5 }}>
                  Dummy data has been cleared. Launch your first recurring plan with billing intervals (daily, weekly, monthly, yearly), minimum seats, and automated lifecycle rules.
                </p>
                {isAdmin && (
                  <button
                    onClick={() => setShowPlanModal(true)}
                    className="neu-btn-primary"
                    style={{ padding: '12px 24px', fontSize: '0.92rem' }}
                  >
                    <Plus size={18} /> Launch First Plan
                  </button>
                )}
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
                {plans.map((plan) => (
                  <div key={plan.id} className="neu-flat-sm" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '16px', position: 'relative' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <h4 style={{ fontSize: '1.15rem', fontWeight: 800 }}>{plan.name}</h4>
                          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>ID: {plan.id}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span className="status-pill status-active" style={{ textTransform: 'capitalize' }}>
                            {plan.frequency}
                          </span>
                          {isAdmin && (
                            <button
                              onClick={() => deletePlan(plan.id)}
                              className="neu-btn"
                              style={{ padding: '5px 8px', color: 'var(--error)' }}
                              title="Delete plan"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </div>

                      <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '12px', color: 'var(--primary)' }}>
                        ${plan.cost.toFixed(2)}
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                          /{plan.frequency === 'daily' ? 'day' : plan.frequency === 'weekly' ? 'wk' : plan.frequency === 'monthly' ? 'mo' : 'yr'}
                        </span>
                      </div>

                      <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginTop: '8px', lineHeight: 1.4 }}>
                        {plan.description || 'Standard recurring contract.'}
                      </p>

                      <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        <div>Min Quantity: <strong>{plan.minQuantity} seat(s)</strong></div>
                        <div>Available: <strong>{plan.startDate}</strong> to <strong>{plan.endDate}</strong></div>
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
            )}
          </div>
        </div>
      )}

      {/* Modal: New Product with Odoo Brand Checkbox & Business Rule */}
      {showProductModal && (
        <div className="modal-overlay" onClick={() => setShowProductModal(false)}>
          <div className="modal-card animate-fade-in" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '720px' }}>
            <h3 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: '6px' }}>
              Launch New Product
            </h3>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
              Scene 2 Specification: Add product details, base pricing, and configure brand variants.
            </p>

            <form onSubmit={handleProductSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Brightloop ERP Business Suite"
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
                    Sales Price ($) *
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
                    Cost Price ($) *
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
                  placeholder="Notes, licensing specs, SLA commitments..."
                  value={productForm.notes}
                  onChange={(e) => setProductForm({ ...productForm, notes: e.target.value })}
                  className="neu-inset neu-input"
                  style={{ resize: 'none' }}
                />
              </div>

              {/* Odoo Brand Variant Checkbox */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input
                  type="checkbox"
                  id="odooBrandCheckbox"
                  checked={productForm.hasOdooBrand}
                  onChange={(e) => setProductForm({ ...productForm, hasOdooBrand: e.target.checked })}
                  style={{ accentColor: 'var(--primary)', width: '15px', height: '15px', cursor: 'pointer' }}
                />
                <label htmlFor="odooBrandCheckbox" style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--text-main)', cursor: 'pointer' }}>
                  Odoo Brand Variant
                </label>
                {productForm.hasOdooBrand && (
                  <span style={{ fontSize: '0.78rem', color: '#5b21b6', fontWeight: 700 }}>
                    (+$560 &rarr; Total: ${((parseFloat(productForm.salesPrice) || 0) + 560).toFixed(2)})
                  </span>
                )}
              </div>

              {/* Optional Additional Custom Variants */}
              <div style={{ borderTop: '1px solid rgba(184, 194, 204, 0.3)', paddingTop: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    Additional Custom Variants (Optional)
                  </label>
                  <button
                    type="button"
                    onClick={addCustomVariant}
                    className="neu-btn"
                    style={{ padding: '4px 10px', fontSize: '0.76rem' }}
                  >
                    + Add Custom Variant
                  </button>
                </div>

                {productForm.customVariants.length === 0 ? (
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Standard Edition ($0.00) and {productForm.hasOdooBrand ? 'Odoo Brand Edition (+$560.00)' : 'no other variants'} will be created.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {productForm.customVariants.map((v, i) => (
                      <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr auto', gap: '8px', alignItems: 'center' }}>
                        <input
                          type="text"
                          placeholder="Variant Name (e.g. Enterprise Edition)"
                          value={v.name}
                          onChange={(e) => updateCustomVariant(i, 'name', e.target.value)}
                          className="neu-inset neu-input"
                          style={{ padding: '8px 12px', fontSize: '0.82rem' }}
                        />
                        <input
                          type="number"
                          placeholder="Price Offset (+$)"
                          value={v.priceOffset}
                          onChange={(e) => updateCustomVariant(i, 'priceOffset', e.target.value)}
                          className="neu-inset neu-input"
                          style={{ padding: '8px 12px', fontSize: '0.82rem' }}
                        />
                        <button
                          type="button"
                          onClick={() => removeCustomVariant(i)}
                          className="neu-btn"
                          style={{ padding: '8px', color: 'var(--error)' }}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
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
                  Save & Launch Product
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
            <h3 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: '6px' }}>
              Launch New Billing Plan
            </h3>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
              Scene 2 Specification: Cost, billing schedule (daily, weekly, monthly, yearly), minimum seats, and lifecycle policies.
            </p>

            <form onSubmit={handlePlanSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  Plan Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Monthly Professional Plan"
                  value={planForm.name}
                  onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                  className="neu-inset neu-input"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                    Cost ($) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="240.00"
                    value={planForm.cost}
                    onChange={(e) => setPlanForm({ ...planForm, cost: e.target.value })}
                    className="neu-inset neu-input"
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                    Billing Frequency *
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
                    Min Quantity (Seats)
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
                    Start Date Available *
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
                    End Date Available *
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

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  Plan Description
                </label>
                <textarea
                  rows="2"
                  placeholder="Terms, contract guidelines, cancellation rules..."
                  value={planForm.description}
                  onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
                  className="neu-inset neu-input"
                  style={{ resize: 'none' }}
                />
              </div>

              {/* Lifecycle Rules Checkbox Grid */}
              <div style={{ borderTop: '1px solid rgba(184, 194, 204, 0.3)', paddingTop: '14px' }}>
                <label style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--text-main)', display: 'block', marginBottom: '10px' }}>
                  Lifecycle Policies (Plan by Plan Control)
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', fontSize: '0.86rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={planForm.autoCloseOnEnd}
                      onChange={(e) => setPlanForm({ ...planForm, autoCloseOnEnd: e.target.checked })}
                      style={{ accentColor: 'var(--primary)', width: '18px', height: '18px' }}
                    />
                    <span><strong>Auto-close on end:</strong> Terminates when end date is reached</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={planForm.canCloseEarly}
                      onChange={(e) => setPlanForm({ ...planForm, canCloseEarly: e.target.checked })}
                      style={{ accentColor: 'var(--primary)', width: '18px', height: '18px' }}
                    />
                    <span><strong>Closable early:</strong> Customer/Admin can cancel before end</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={planForm.canPause}
                      onChange={(e) => setPlanForm({ ...planForm, canPause: e.target.checked })}
                      style={{ accentColor: 'var(--primary)', width: '18px', height: '18px' }}
                    />
                    <span><strong>Pausable:</strong> Can temporarily halt recurring billing</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={planForm.canRenew}
                      onChange={(e) => setPlanForm({ ...planForm, canRenew: e.target.checked })}
                      style={{ accentColor: 'var(--primary)', width: '18px', height: '18px' }}
                    />
                    <span><strong>Renewable:</strong> Can be extended into a new cycle</span>
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
                  Save & Launch Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
