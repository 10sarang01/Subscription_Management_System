import React, { useState } from 'react';
import {
  Calendar,
  Save,
} from 'lucide-react';
import { EMPTY_PLAN_FORM, BILLING_LABELS } from './productConstants';

export default function PlanFormModal({ product, editingPlan, onSubmit, onClose }) {
  const [form, setForm] = useState(editingPlan || {
    ...EMPTY_PLAN_FORM,
    price: product.salesPrice || ''
  });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Plan name is required.';
    if (form.price === '' || isNaN(parseFloat(form.price))) {
      e.price = 'Valid price is required.';
    } else if (parseFloat(form.price) < 0) {
      e.price = 'Price cannot be negative.';
    }
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
    if (parseFloat(form.price) < 0) return;
    onSubmit({
      ...form,
      price: Math.max(0, parseFloat(form.price)),
      minimumQuantity: Math.max(1, parseInt(form.minimumQuantity) || 1)
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
                  onChange={e => {
                    const val = e.target.value;
                    if (val === '' || parseFloat(val) >= 0) {
                      set('price', val);
                    }
                  }}
                  onKeyDown={e => ['-', '+', 'e', 'E'].includes(e.key) && e.preventDefault()}
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
                onChange={e => {
                  const val = e.target.value;
                  if (val === '' || parseInt(val) >= 1) {
                    set('minimumQuantity', val);
                  }
                }}
                onKeyDown={e => ['-', '+', 'e', 'E'].includes(e.key) && e.preventDefault()}
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
