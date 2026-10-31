import React, { useState, useEffect } from 'react';
import {
  Package,
  Plus,
  Calendar,
  Check,
  X,
  Shield,
  Trash2,
  ArrowLeft,
  Edit3,
  ToggleLeft,
  ToggleRight,
  Layers,
  Tag,
  Clock,
  ChevronRight,
  AlertCircle,
  Save,
  DollarSign,
  Info
} from 'lucide-react';
import { useSubscription } from '../context/SubscriptionContext';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const BILLING_LABELS = {
  daily: { label: 'Daily', short: 'day' },
  weekly: { label: 'Weekly', short: 'wk' },
  monthly: { label: 'Monthly', short: 'mo' },
  yearly: { label: 'Yearly', short: 'yr' }
};

const EMPTY_PLAN_FORM = {
  name: '',
  price: '',
  billingInterval: 'monthly',
  minimumQuantity: 1,
  availableFrom: new Date().toISOString().split('T')[0],
  availableUntil: '2027-12-31',
  autoClose: true,
  allowEarlyClose: true,
  allowPause: true,
  allowRenew: true,
  description: ''
};

const EMPTY_PRODUCT_FORM = {
  name: '',
  type: 'Software',
  salesPrice: '',
  costPrice: '',
  notes: '',
  hasOdooBrand: false,
  customVariants: []
};

// ─── Plan Form Modal ──────────────────────────────────────────────────────────

function PlanFormModal({ product, editingPlan, onSubmit, onClose }) {
  const [form, setForm] = useState(editingPlan || {
    ...EMPTY_PLAN_FORM,
    price: product.salesPrice || ''
  });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Plan name is required.';
    if (form.price === '' || isNaN(parseFloat(form.price))) e.price = 'Valid price is required.';
    if (parseFloat(form.price) < 0) e.price = 'Price cannot be negative.';
    if (!form.availableFrom) e.availableFrom = 'Start date is required.';
    if (!form.availableUntil) e.availableUntil = 'End date is required.';
    if (form.availableFrom && form.availableUntil && form.availableFrom >= form.availableUntil) {
      e.availableUntil = 'End date must be after start date.';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({
      ...form,
      price: parseFloat(form.price),
      minimumQuantity: parseInt(form.minimumQuantity) || 1
    });
  };

  const isEditing = Boolean(editingPlan);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-card animate-fade-in"
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: '680px' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '10px',
            background: 'linear-gradient(135deg, var(--primary), #6366f1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff'
          }}>
            <Calendar size={18} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>
              {isEditing ? 'Edit Plan' : 'New Billing Plan'}
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {product.name}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '20px' }}>
          {/* Plan Name */}
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '5px' }}>
              Plan Name *
            </label>
            <input
              type="text"
              placeholder="e.g. Monthly Professional, Annual Enterprise..."
              value={form.name}
              onChange={e => set('name', e.target.value)}
              className="neu-inset neu-input"
            />
            {errors.name && <p style={{ color: 'var(--error)', fontSize: '0.75rem', marginTop: '3px' }}>{errors.name}</p>}
          </div>

          {/* Price + Interval + Min Qty */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '5px' }}>
                Recurring Price *
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontWeight: 700 }}>₹</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="2000.00"
                  value={form.price}
                  onChange={e => set('price', e.target.value)}
                  className="neu-inset neu-input"
                  style={{ paddingLeft: '26px' }}
                />
              </div>
              {errors.price && <p style={{ color: 'var(--error)', fontSize: '0.75rem', marginTop: '3px' }}>{errors.price}</p>}
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '5px' }}>
                Billing Interval *
              </label>
              <select
                value={form.billingInterval}
                onChange={e => set('billingInterval', e.target.value)}
                className="neu-inset neu-input"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '5px' }}>
                Min. Quantity
              </label>
              <input
                type="number"
                min="1"
                value={form.minimumQuantity}
                onChange={e => set('minimumQuantity', e.target.value)}
                className="neu-inset neu-input"
              />
            </div>
          </div>

          {/* Availability */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '5px' }}>
                Available From *
              </label>
              <input
                type="date"
                value={form.availableFrom}
                onChange={e => set('availableFrom', e.target.value)}
                className="neu-inset neu-input"
              />
              {errors.availableFrom && <p style={{ color: 'var(--error)', fontSize: '0.75rem', marginTop: '3px' }}>{errors.availableFrom}</p>}
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '5px' }}>
                Available Until *
              </label>
              <input
                type="date"
                value={form.availableUntil}
                onChange={e => set('availableUntil', e.target.value)}
                className="neu-inset neu-input"
              />
              {errors.availableUntil && <p style={{ color: 'var(--error)', fontSize: '0.75rem', marginTop: '3px' }}>{errors.availableUntil}</p>}
            </div>
          </div>

          {/* Description */}
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '5px' }}>
              Description (optional)
            </label>
            <textarea
              rows="2"
              placeholder="Contract terms, cancellation policy, SLA notes..."
              value={form.description}
              onChange={e => set('description', e.target.value)}
              className="neu-inset neu-input"
              style={{ resize: 'none' }}
            />
          </div>

          {/* Lifecycle Settings */}
          <div style={{ borderTop: '1px solid rgba(184,194,204,0.3)', paddingTop: '12px' }}>
            <label style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--text-main)', display: 'block', marginBottom: '10px' }}>
              Subscription Lifecycle Settings
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {[
                { field: 'autoClose', label: 'Auto-close on expiry', desc: 'Terminates when end date is reached' },
                { field: 'allowEarlyClose', label: 'Allow early closure', desc: 'Customer/Admin can cancel before end' },
                { field: 'allowPause', label: 'Allow pausing', desc: 'Can temporarily halt recurring billing' },
                { field: 'allowRenew', label: 'Allow renewal', desc: 'Can be extended into a new cycle' }
              ].map(({ field, label, desc }) => (
                <label key={field} style={{
                  display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer',
                  padding: '10px 12px', borderRadius: '10px',
                  background: form[field] ? 'rgba(79,70,229,0.05)' : 'transparent',
                  border: `1px solid ${form[field] ? 'rgba(79,70,229,0.2)' : 'rgba(184,194,204,0.3)'}`,
                  transition: 'all 0.15s ease'
                }}>
                  <input
                    type="checkbox"
                    checked={form[field]}
                    onChange={e => set(field, e.target.checked)}
                    style={{ accentColor: 'var(--primary)', width: '16px', height: '16px', marginTop: '1px', flexShrink: 0 }}
                  />
                  <div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)' }}>{label}</div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '1px' }}>{desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Pricing summary preview */}
          {form.price && !isNaN(parseFloat(form.price)) && (
            <div className="neu-inset-sm" style={{ padding: '12px 16px', borderRadius: '10px', fontSize: '0.82rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                <span style={{ color: 'var(--text-muted)' }}>
                  Base plan price:
                  <strong style={{ color: 'var(--text-main)', marginLeft: '6px' }}>
                    ₹{parseFloat(form.price).toFixed(2)}/{BILLING_LABELS[form.billingInterval]?.short || 'mo'}
                  </strong>
                </span>
                {product.variants?.filter(v => v.priceOffset > 0).map((v, i) => (
                  <span key={i} style={{ color: '#5b21b6' }}>
                    +{v.name}: <strong>₹{(parseFloat(form.price) + v.priceOffset).toFixed(2)}</strong>
                  </span>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '4px' }}>
            <button type="button" onClick={onClose} className="neu-btn" style={{ padding: '10px 18px' }}>
              Cancel
            </button>
            <button type="submit" className="neu-btn-primary" style={{ padding: '10px 22px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Save size={15} />
              {isEditing ? 'Save Changes' : 'Create Plan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Product Detail View ──────────────────────────────────────────────────────

function ProductDetailView({ product, onBack }) {
  const {
    getPlansForProduct,
    addProductPlan,
    updateProductPlan,
    toggleProductPlan,
    deleteProductPlan,
    deleteProduct,
    currentPersona
  } = useSubscription();

  const isAdmin = currentPersona.role === 'admin';
  const [activeTab, setActiveTab] = useState('plans');
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [confirmDeletePlan, setConfirmDeletePlan] = useState(null);

  const plans = getPlansForProduct(product.id);
  const activePlans = plans.filter(p => p.isActive);

  const handleAddPlan = async (planData) => {
    await addProductPlan(product.id, planData);
    setShowPlanModal(false);
  };

  const handleEditPlan = async (planData) => {
    await updateProductPlan(editingPlan.id, product.id, planData);
    setEditingPlan(null);
  };

  const handleToggle = async (plan) => {
    await toggleProductPlan(plan.id, product.id, !plan.isActive);
  };

  const handleDeletePlan = async (planId) => {
    await deleteProductPlan(planId, product.id);
    setConfirmDeletePlan(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div className="neu-flat" style={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button onClick={onBack} className="neu-btn" style={{ padding: '8px 10px', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.82rem' }}>
              <ArrowLeft size={15} /> Products
            </button>
            <div style={{ width: '1px', height: '24px', background: 'rgba(184,194,204,0.4)' }} />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>{product.name}</h2>
                <span className="status-pill status-confirmed" style={{ textTransform: 'capitalize', fontSize: '0.72rem' }}>{product.type}</span>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                {activePlans.length} active plan{activePlans.length !== 1 ? 's' : ''} · {plans.length} total
              </p>
            </div>
          </div>
          {isAdmin && (
            <button
              onClick={() => deleteProduct(product.id) && onBack()}
              className="neu-btn"
              style={{ padding: '7px 12px', fontSize: '0.8rem', color: 'var(--error)', display: 'flex', alignItems: 'center', gap: '5px' }}
            >
              <Trash2 size={14} /> Delete Product
            </button>
          )}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '4px', marginTop: '16px', borderBottom: '2px solid rgba(184,194,204,0.3)', paddingBottom: '0' }}>
          {['details', 'variants', 'plans'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '8px 18px',
                fontSize: '0.85rem',
                fontWeight: 700,
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                borderBottom: activeTab === tab ? '2px solid var(--primary)' : '2px solid transparent',
                color: activeTab === tab ? 'var(--primary)' : 'var(--text-muted)',
                marginBottom: '-2px',
                textTransform: 'capitalize',
                transition: 'all 0.15s ease'
              }}
            >
              {tab === 'plans' ? `Plans (${plans.length})` : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* ── Details Tab ── */}
      {activeTab === 'details' && (
        <div className="neu-flat" style={{ padding: '24px 28px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
            {[
              { label: 'Product Name', value: product.name },
              { label: 'Type', value: product.type },
              { label: 'Sales Price', value: `₹${(product.salesPrice || 0).toFixed(2)}` },
              { label: 'Cost Price (Internal)', value: `₹${(product.costPrice || 0).toFixed(2)}`, muted: true },
              { label: 'Margin', value: product.salesPrice > 0 ? `${(((product.salesPrice - product.costPrice) / product.salesPrice) * 100).toFixed(0)}%` : '—' }
            ].map(({ label, value, muted }) => (
              <div key={label} className="neu-inset-sm" style={{ padding: '14px 16px', borderRadius: '12px' }}>
                <div style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>{label}</div>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: muted ? 'var(--text-muted)' : 'var(--text-main)' }}>{value}</div>
              </div>
            ))}
          </div>
          {product.notes && (
            <div style={{ marginTop: '16px', padding: '14px 16px', borderRadius: '12px', background: 'rgba(79,70,229,0.04)', border: '1px solid rgba(79,70,229,0.12)' }}>
              <div style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Notes</div>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-main)', lineHeight: 1.5 }}>{product.notes}</p>
            </div>
          )}
          <div className="neu-inset-sm" style={{ padding: '12px 16px', borderRadius: '12px', marginTop: '16px', fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Info size={14} />
            Cost price is internal only and is not shown to customers. The plan price is used for customer billing.
          </div>
        </div>
      )}

      {/* ── Variants Tab ── */}
      {activeTab === 'variants' && (
        <div className="neu-flat" style={{ padding: '24px 28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 800 }}>Product Variants</h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Each variant adds to the base plan price when a customer subscribes.
              </p>
            </div>
            {product.variants?.length > 0 && (
              <span style={{
                fontSize: '0.75rem', fontWeight: 700, padding: '4px 10px',
                borderRadius: '999px', background: 'rgba(79,70,229,0.1)', color: 'var(--primary)'
              }}>
                {product.variants.length} variant{product.variants.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {(!product.variants || product.variants.length === 0) ? (
            <div className="neu-inset-sm" style={{ padding: '48px', textAlign: 'center', borderRadius: '16px' }}>
              <Tag size={32} style={{ color: 'var(--text-muted)', margin: '0 auto 12px', display: 'block' }} />
              <p style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-muted)' }}>No variants defined for this product.</p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>Variants are added during product creation.</p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '16px'
            }}>
              {product.variants.map((v, i) => {
                const isOdoo = v.name.toLowerCase().includes('odoo');
                const isStandard = v.priceOffset === 0;

                return (
                  <div key={i} style={{
                    position: 'relative',
                    padding: '24px 20px',
                    borderRadius: '18px',
                    background: isOdoo
                      ? 'linear-gradient(135deg, #5b21b6 0%, #7c3aed 100%)'
                      : isStandard
                        ? 'linear-gradient(135deg, var(--primary) 0%, #6366f1 100%)'
                        : 'linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)',
                    boxShadow: isOdoo
                      ? '0 8px 32px rgba(91,33,182,0.35), inset 0 1px 0 rgba(255,255,255,0.15)'
                      : isStandard
                        ? '0 8px 32px rgba(79,70,229,0.3), inset 0 1px 0 rgba(255,255,255,0.15)'
                        : '0 8px 32px rgba(15,118,110,0.3), inset 0 1px 0 rgba(255,255,255,0.15)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px',
                    overflow: 'hidden',
                    cursor: 'default',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                  }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = isOdoo ? '0 14px 40px rgba(91,33,182,0.45)' : '0 14px 40px rgba(79,70,229,0.4)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = isOdoo ? '0 8px 32px rgba(91,33,182,0.35), inset 0 1px 0 rgba(255,255,255,0.15)' : '0 8px 32px rgba(79,70,229,0.3), inset 0 1px 0 rgba(255,255,255,0.15)'; }}
                  >
                    {/* Background decoration circle */}
                    <div style={{
                      position: 'absolute', top: '-20px', right: '-20px',
                      width: '90px', height: '90px', borderRadius: '50%',
                      background: 'rgba(255,255,255,0.07)'
                    }} />
                    <div style={{
                      position: 'absolute', bottom: '-30px', left: '-10px',
                      width: '70px', height: '70px', borderRadius: '50%',
                      background: 'rgba(255,255,255,0.05)'
                    }} />

                    {/* Top row: icon + type badge */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{
                        width: '38px', height: '38px', borderRadius: '12px',
                        background: 'rgba(255,255,255,0.18)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '1.1rem'
                      }}>
                        {isOdoo ? '👑' : isStandard ? '⭐' : '🔷'}
                      </div>
                      <span style={{
                        fontSize: '0.68rem', fontWeight: 800, padding: '3px 9px',
                        borderRadius: '999px',
                        background: 'rgba(255,255,255,0.18)',
                        color: '#fff',
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em'
                      }}>
                        {isOdoo ? 'Brand' : isStandard ? 'Base' : 'Custom'}
                      </span>
                    </div>

                    {/* Variant name */}
                    <div>
                      <div style={{
                        fontSize: '1.05rem', fontWeight: 800, color: '#fff',
                        lineHeight: 1.2, marginBottom: '4px'
                      }}>
                        {v.name}
                      </div>
                      <div style={{ fontSize: '0.74rem', color: 'rgba(255,255,255,0.65)' }}>
                        {isOdoo ? 'Premium branded edition' : isStandard ? 'Default included edition' : 'Additional edition'}
                      </div>
                    </div>

                    {/* Price badge */}
                    <div style={{
                      background: 'rgba(255,255,255,0.15)',
                      borderRadius: '12px',
                      padding: '10px 14px',
                      backdropFilter: 'blur(8px)',
                      border: '1px solid rgba(255,255,255,0.2)'
                    }}>
                      <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.7)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>
                        Price offset
                      </div>
                      <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fff' }}>
                        {v.priceOffset > 0 ? `+₹${v.priceOffset.toLocaleString()}` : '₹0'}
                      </div>
                      {v.priceOffset > 0 && (
                        <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.6)', marginTop: '2px' }}>
                          added to plan price
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="neu-inset-sm" style={{ padding: '12px 16px', borderRadius: '12px', marginTop: '20px', fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Info size={14} />
            Effective price = Plan price + Variant offset. Variants are set at product creation time.
          </div>
        </div>
      )}

      {/* ── Plans Tab ── */}
      {activeTab === 'plans' && (
        <div className="neu-flat" style={{ padding: '24px 28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 800 }}>Billing Plans</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Plans define pricing and billing cycles specific to <strong>{product.name}</strong>.
              </p>
            </div>
            {isAdmin && (
              <button
                onClick={() => setShowPlanModal(true)}
                className="neu-btn-primary"
                style={{ padding: '9px 16px', fontSize: '0.84rem', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Plus size={16} /> Add New Plan
              </button>
            )}
          </div>

          {plans.length === 0 ? (
            <div className="neu-inset-sm" style={{ padding: '48px 24px', textAlign: 'center', borderRadius: '16px' }}>
              <div className="neu-flat-sm" style={{ width: '52px', height: '52px', borderRadius: '50%', margin: '0 auto 14px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                <Calendar size={26} />
              </div>
              <h4 style={{ fontSize: '1.05rem', fontWeight: 800 }}>No Plans Yet</h4>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', maxWidth: '400px', margin: '8px auto 18px', lineHeight: 1.5 }}>
                Add billing plans to define how customers subscribe to <strong>{product.name}</strong>.
                Each plan has its own price, interval, and lifecycle settings.
              </p>
              {isAdmin && (
                <button onClick={() => setShowPlanModal(true)} className="neu-btn-primary" style={{ padding: '10px 22px', display: 'flex', alignItems: 'center', gap: '7px', margin: '0 auto' }}>
                  <Plus size={16} /> Add First Plan
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {plans.map(plan => (
                <div
                  key={plan.id}
                  className="neu-flat-sm"
                  style={{
                    padding: '16px 20px',
                    borderRadius: '14px',
                    opacity: plan.isActive ? 1 : 0.6,
                    border: plan.isActive ? '1px solid rgba(79,70,229,0.15)' : '1px solid rgba(184,194,204,0.3)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                    {/* Left: Plan info */}
                    <div style={{ flex: 1, minWidth: '200px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '6px' }}>
                        <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-main)' }}>{plan.name}</span>
                        <span style={{
                          fontSize: '0.7rem', padding: '2px 8px', borderRadius: '999px', fontWeight: 700,
                          background: plan.isActive ? '#dcfce7' : '#fee2e2',
                          color: plan.isActive ? '#15803d' : '#dc2626'
                        }}>
                          {plan.isActive ? '● Active' : '○ Inactive'}
                        </span>
                        <span style={{
                          fontSize: '0.7rem', padding: '2px 8px', borderRadius: '999px', fontWeight: 700,
                          background: 'rgba(79,70,229,0.08)', color: 'var(--primary)', textTransform: 'capitalize'
                        }}>
                          {BILLING_LABELS[plan.billingInterval]?.label || plan.billingInterval}
                        </span>
                      </div>

                      {/* Price display */}
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '8px' }}>
                        <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)' }}>
                          ₹{(plan.price || 0).toFixed(2)}
                        </span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                          /{BILLING_LABELS[plan.billingInterval]?.short || 'mo'}
                        </span>
                        {product.variants?.filter(v => v.priceOffset > 0).map((v, i) => (
                          <span key={i} style={{ fontSize: '0.75rem', color: '#5b21b6', fontWeight: 600, marginLeft: '8px' }}>
                            +₹{v.priceOffset} ({v.name})
                          </span>
                        ))}
                      </div>

                      {/* Meta info */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                        <span>Min qty: <strong>{plan.minimumQuantity}</strong></span>
                        <span>Available: <strong>{plan.availableFrom}</strong> → <strong>{plan.availableUntil}</strong></span>
                      </div>

                      {plan.description && (
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '6px', lineHeight: 1.4 }}>{plan.description}</p>
                      )}

                      {/* Lifecycle badges */}
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '10px' }}>
                        {[
                          { flag: plan.autoClose, label: 'Auto-close' },
                          { flag: plan.allowEarlyClose, label: 'Early close' },
                          { flag: plan.allowPause, label: 'Pausable' },
                          { flag: plan.allowRenew, label: 'Renewable' }
                        ].map(({ flag, label }) => (
                          <span key={label} style={{
                            fontSize: '0.7rem', padding: '2px 8px', borderRadius: '999px', fontWeight: 600,
                            display: 'flex', alignItems: 'center', gap: '3px',
                            background: flag ? 'rgba(22,163,74,0.1)' : 'rgba(220,38,38,0.07)',
                            color: flag ? '#16a34a' : '#dc2626'
                          }}>
                            {flag ? <Check size={10} /> : <X size={10} />}
                            {label}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Right: Actions */}
                    {isAdmin && (
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-start', flexShrink: 0 }}>
                        <button
                          onClick={() => setEditingPlan(plan)}
                          className="neu-btn"
                          style={{ padding: '7px 10px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                          title="Edit plan"
                        >
                          <Edit3 size={13} /> Edit
                        </button>
                        <button
                          onClick={() => handleToggle(plan)}
                          className="neu-btn"
                          style={{
                            padding: '7px 10px', fontSize: '0.78rem',
                            display: 'flex', alignItems: 'center', gap: '4px',
                            color: plan.isActive ? '#d97706' : '#16a34a'
                          }}
                          title={plan.isActive ? 'Deactivate' : 'Activate'}
                        >
                          {plan.isActive ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                          {plan.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => setConfirmDeletePlan(plan.id)}
                          className="neu-btn"
                          style={{ padding: '7px 9px', color: 'var(--error)' }}
                          title="Delete plan"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Plan Form Modal */}
      {(showPlanModal || editingPlan) && (
        <PlanFormModal
          product={product}
          editingPlan={editingPlan}
          onSubmit={editingPlan ? handleEditPlan : handleAddPlan}
          onClose={() => { setShowPlanModal(false); setEditingPlan(null); }}
        />
      )}

      {/* Confirm Delete Plan */}
      {confirmDeletePlan && (
        <div className="modal-overlay" onClick={() => setConfirmDeletePlan(null)}>
          <div className="modal-card animate-fade-in" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px', textAlign: 'center' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', color: '#dc2626' }}>
              <AlertCircle size={24} />
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '8px' }}>Delete Plan?</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '20px', lineHeight: 1.5 }}>
              This will permanently remove the plan. Active subscriptions using it will not be affected.
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button onClick={() => setConfirmDeletePlan(null)} className="neu-btn" style={{ padding: '9px 18px' }}>Cancel</button>
              <button onClick={() => handleDeletePlan(confirmDeletePlan)} className="neu-btn-primary" style={{ padding: '9px 18px', background: 'var(--error)', borderColor: 'var(--error)' }}>
                Delete Plan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Products List View ───────────────────────────────────────────────────────

function ProductsList({ onSelectProduct }) {
  const { products, addProduct, deleteProduct, getPlansForProduct, currentPersona } = useSubscription();
  const isAdmin = currentPersona.role === 'admin';
  const [showProductModal, setShowProductModal] = useState(false);
  const [productForm, setProductForm] = useState(EMPTY_PRODUCT_FORM);

  const addCustomVariant = () =>
    setProductForm(f => ({ ...f, customVariants: [...f.customVariants, { name: '', priceOffset: 0 }] }));

  const updateCustomVariant = (i, field, value) => {
    const updated = [...productForm.customVariants];
    updated[i][field] = field === 'priceOffset' ? parseFloat(value) || 0 : value;
    setProductForm(f => ({ ...f, customVariants: updated }));
  };

  const removeCustomVariant = (i) =>
    setProductForm(f => ({ ...f, customVariants: f.customVariants.filter((_, idx) => idx !== i) }));

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    const variants = [{ name: 'Standard Edition', priceOffset: 0 }];
    if (productForm.hasOdooBrand) {
      variants.push({ name: 'Odoo Brand Edition', priceOffset: 560 });
    }
    productForm.customVariants.forEach(cv => {
      if (cv.name.trim()) variants.push({ name: cv.name.trim(), priceOffset: parseFloat(cv.priceOffset) || 0 });
    });

    await addProduct({
      name: productForm.name,
      type: productForm.type,
      salesPrice: parseFloat(productForm.salesPrice) || 0,
      costPrice: parseFloat(productForm.costPrice) || 0,
      notes: productForm.notes,
      hasOdooVariant: productForm.hasOdooBrand,
      odooPriceOffset: 560,
      variants
    });

    setProductForm(EMPTY_PRODUCT_FORM);
    setShowProductModal(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Page Header */}
      <div className="neu-flat" style={{ padding: '22px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)' }}>Products &amp; Plans</h2>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginTop: '3px' }}>
            Each product has its own independent billing plans. Click a product to manage its plans.
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowProductModal(true)}
            className="neu-btn-primary"
            style={{ padding: '10px 18px', fontSize: '0.86rem', display: 'flex', alignItems: 'center', gap: '7px' }}
          >
            <Plus size={16} /> New Product
          </button>
        )}
      </div>

      {/* Products Grid / Table */}
      <div className="neu-flat" style={{ padding: '24px 28px' }}>
        {products.length === 0 ? (
          <div className="neu-inset-sm" style={{ padding: '48px 24px', textAlign: 'center', borderRadius: '16px' }}>
            <div className="neu-flat-sm" style={{ width: '56px', height: '56px', borderRadius: '50%', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
              <Package size={28} />
            </div>
            <h4 style={{ fontSize: '1.15rem', fontWeight: 800 }}>No Products Yet</h4>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', maxWidth: '440px', margin: '8px auto 20px', lineHeight: 1.5 }}>
              Create your first product, then add subscription plans to it. Each product can have multiple independent plans.
            </p>
            {isAdmin && (
              <button onClick={() => setShowProductModal(true)} className="neu-btn-primary" style={{ padding: '11px 24px', display: 'flex', alignItems: 'center', gap: '7px', margin: '0 auto' }}>
                <Plus size={16} /> Create First Product
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {products.map(product => {
              const plans = getPlansForProduct(product.id);
              const activePlans = plans.filter(p => p.isActive);
              const margin = product.salesPrice > 0
                ? (((product.salesPrice - product.costPrice) / product.salesPrice) * 100).toFixed(0)
                : 0;

              return (
                <div
                  key={product.id}
                  onClick={() => onSelectProduct(product)}
                  className="neu-flat-sm"
                  style={{
                    padding: '16px 20px',
                    borderRadius: '14px',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '12px',
                    transition: 'all 0.15s ease',
                    border: '1px solid rgba(184,194,204,0.2)'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(79,70,229,0.25)'; e.currentTarget.style.transform = 'translateX(2px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(184,194,204,0.2)'; e.currentTarget.style.transform = 'translateX(0)'; }}
                >
                  {/* Product info */}
                  <div style={{ flex: 1, minWidth: '200px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>{product.name}</span>
                      <span className="status-pill status-confirmed" style={{ fontSize: '0.7rem', textTransform: 'capitalize' }}>{product.type}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '14px', fontSize: '0.78rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                      <span>Sales price: <strong style={{ color: 'var(--text-main)' }}>₹{(product.salesPrice || 0).toFixed(2)}</strong></span>
                      <span>Margin: <strong style={{ color: 'var(--success)' }}>{margin}%</strong></span>
                      {product.variants?.length > 0 && (
                        <span>{product.variants.length} variant{product.variants.length !== 1 ? 's' : ''}</span>
                      )}
                    </div>
                  </div>

                  {/* Plan count badge */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Plans</div>
                      <div style={{ fontWeight: 800, fontSize: '1.1rem', color: activePlans.length > 0 ? 'var(--primary)' : 'var(--text-muted)' }}>
                        {activePlans.length}
                        <span style={{ fontSize: '0.72rem', fontWeight: 400, color: 'var(--text-muted)', marginLeft: '3px' }}>active</span>
                      </div>
                    </div>
                    <ChevronRight size={18} style={{ color: 'var(--text-muted)' }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Product Modal */}
      {showProductModal && (
        <div className="modal-overlay" onClick={() => setShowProductModal(false)}>
          <div className="modal-card animate-fade-in" onClick={e => e.stopPropagation()} style={{ maxWidth: '680px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, var(--primary), #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                <Package size={18} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Create New Product</h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>You can add billing plans after creating the product.</p>
              </div>
            </div>

            <form onSubmit={handleProductSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '5px' }}>Product Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CRM Software, Inventory Management..."
                  value={productForm.name}
                  onChange={e => setProductForm(f => ({ ...f, name: e.target.value }))}
                  className="neu-inset neu-input"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '5px' }}>Type</label>
                  <select
                    value={productForm.type}
                    onChange={e => setProductForm(f => ({ ...f, type: e.target.value }))}
                    className="neu-inset neu-input"
                  >
                    <option value="Software">Software</option>
                    <option value="Add-on">Add-on</option>
                    <option value="Service">Service</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '5px' }}>Sales Price (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="2000.00"
                    value={productForm.salesPrice}
                    onChange={e => setProductForm(f => ({ ...f, salesPrice: e.target.value }))}
                    className="neu-inset neu-input"
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '5px' }}>Cost Price (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="850.00"
                    value={productForm.costPrice}
                    onChange={e => setProductForm(f => ({ ...f, costPrice: e.target.value }))}
                    className="neu-inset neu-input"
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '5px' }}>Notes</label>
                <textarea
                  rows="2"
                  placeholder="Product description, licensing specs, SLA..."
                  value={productForm.notes}
                  onChange={e => setProductForm(f => ({ ...f, notes: e.target.value }))}
                  className="neu-inset neu-input"
                  style={{ resize: 'none' }}
                />
              </div>

              {/* Odoo Brand Variant */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input
                  type="checkbox"
                  id="odooBrandCheckbox"
                  checked={productForm.hasOdooBrand}
                  onChange={e => setProductForm(f => ({ ...f, hasOdooBrand: e.target.checked }))}
                  style={{ accentColor: 'var(--primary)', width: '15px', height: '15px', cursor: 'pointer' }}
                />
                <label htmlFor="odooBrandCheckbox" style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--text-main)', cursor: 'pointer' }}>
                  Odoo Brand Variant
                </label>
                {productForm.hasOdooBrand && (
                  <span style={{ fontSize: '0.78rem', color: '#5b21b6', fontWeight: 700 }}>
                    (+₹560 added to plan price for Odoo edition)
                  </span>
                )}
              </div>

              {/* Custom Variants */}
              <div style={{ borderTop: '1px solid rgba(184,194,204,0.3)', paddingTop: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    Additional Custom Variants (optional)
                  </label>
                  <button type="button" onClick={addCustomVariant} className="neu-btn" style={{ padding: '4px 10px', fontSize: '0.76rem' }}>
                    + Add Variant
                  </button>
                </div>
                {productForm.customVariants.length === 0 ? (
                  <p style={{ fontSize: '0.77rem', color: 'var(--text-muted)' }}>
                    Standard Edition (+₹0) {productForm.hasOdooBrand ? 'and Odoo Brand Edition (+₹560) ' : ''}will be created by default.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {productForm.customVariants.map((v, i) => (
                      <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr auto', gap: '8px', alignItems: 'center' }}>
                        <input
                          type="text"
                          placeholder="Variant Name"
                          value={v.name}
                          onChange={e => updateCustomVariant(i, 'name', e.target.value)}
                          className="neu-inset neu-input"
                          style={{ padding: '8px 12px', fontSize: '0.82rem' }}
                        />
                        <input
                          type="number"
                          placeholder="Price Offset (+₹)"
                          value={v.priceOffset}
                          onChange={e => updateCustomVariant(i, 'priceOffset', e.target.value)}
                          className="neu-inset neu-input"
                          style={{ padding: '8px 12px', fontSize: '0.82rem' }}
                        />
                        <button type="button" onClick={() => removeCustomVariant(i)} className="neu-btn" style={{ padding: '8px', color: 'var(--error)' }}>
                          <X size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '4px' }}>
                <button type="button" onClick={() => setShowProductModal(false)} className="neu-btn" style={{ padding: '10px 18px' }}>Cancel</button>
                <button type="submit" className="neu-btn-primary" style={{ padding: '10px 22px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Save size={15} /> Create Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main ProductsPage Export ─────────────────────────────────────────────────

export default function ProductsPage() {
  const [selectedProduct, setSelectedProduct] = useState(null);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
      {selectedProduct ? (
        <ProductDetailView
          product={selectedProduct}
          onBack={() => setSelectedProduct(null)}
        />
      ) : (
        <ProductsList onSelectProduct={setSelectedProduct} />
      )}
    </div>
  );
}
