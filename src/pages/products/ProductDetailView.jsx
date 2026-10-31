import React, { useState } from 'react';
import {
  Plus,
  Calendar,
  Check,
  X,
  Trash2,
  ArrowLeft,
  Edit3,
  ToggleLeft,
  ToggleRight,
  Tag,
  AlertCircle,
  Info,
} from 'lucide-react';
import { useSubscription } from '../../context/SubscriptionContext';
import { BILLING_LABELS } from './productConstants';
import PlanFormModal from './PlanFormModal';
import ProductFormModal from './ProductFormModal';

export default function ProductDetailView({ product, onBack }) {
  const {
    getPlansForProduct,
    addProductPlan,
    updateProductPlan,
    toggleProductPlan,
    deleteProductPlan,
    deleteProduct,
    updateProduct,
    currentPersona
  } = useSubscription();

  const isAdmin = currentPersona.role === 'admin';
  const [activeTab, setActiveTab] = useState('plans');
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [confirmDeletePlan, setConfirmDeletePlan] = useState(null);
  const [showEditProductModal, setShowEditProductModal] = useState(false);

  const plans = getPlansForProduct(product.id);
  const activePlans = plans.filter(p => p.isActive);

  const handleUpdateProduct = async (productData) => {
    await updateProduct(product.id, productData);
    setShowEditProductModal(false);
  };

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
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={() => setShowEditProductModal(true)}
                className="neu-btn"
                style={{ padding: '7px 14px', fontSize: '0.8rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '5px' }}
                title="Edit Product Details & Variants"
              >
                <Edit3 size={14} /> Edit Product
              </button>
              <button
                onClick={() => deleteProduct(product.id) && onBack()}
                className="neu-btn"
                style={{ padding: '7px 12px', fontSize: '0.8rem', color: 'var(--error)', display: 'flex', alignItems: 'center', gap: '5px' }}
              >
                <Trash2 size={14} /> Delete Product
              </button>
            </div>
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800 }}>General Information</h3>
            {isAdmin && (
              <button
                onClick={() => setShowEditProductModal(true)}
                className="neu-btn"
                style={{ padding: '6px 12px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--primary)' }}
              >
                <Edit3 size={13} /> Edit Details
              </button>
            )}
          </div>
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 800 }}>Product Variants</h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Each variant adds to the base plan price when a customer subscribes.
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {product.variants?.length > 0 && (
                <span style={{
                  fontSize: '0.75rem', fontWeight: 700, padding: '4px 10px',
                  borderRadius: '999px', background: 'rgba(79,70,229,0.1)', color: 'var(--primary)'
                }}>
                  {product.variants.length} variant{product.variants.length !== 1 ? 's' : ''}
                </span>
              )}
              {isAdmin && (
                <button
                  onClick={() => setShowEditProductModal(true)}
                  className="neu-btn"
                  style={{ padding: '6px 12px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--primary)' }}
                >
                  <Edit3 size={13} /> Edit Variants
                </button>
              )}
            </div>
          </div>

          {(!product.variants || product.variants.length === 0) ? (
            <div className="neu-inset-sm" style={{ padding: '48px', textAlign: 'center', borderRadius: '16px' }}>
              <Tag size={32} style={{ color: 'var(--text-muted)', margin: '0 auto 12px', display: 'block' }} />
              <p style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-muted)' }}>No variants defined for this product.</p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>Variants are added during product creation or edit.</p>
              {isAdmin && (
                <button
                  onClick={() => setShowEditProductModal(true)}
                  className="neu-btn-primary"
                  style={{ padding: '8px 16px', fontSize: '0.82rem', marginTop: '14px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                >
                  <Edit3 size={14} /> Add Variants
                </button>
              )}
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

      {/* Product Edit Modal */}
      {showEditProductModal && (
        <ProductFormModal
          product={product}
          onSubmit={handleUpdateProduct}
          onClose={() => setShowEditProductModal(false)}
        />
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
