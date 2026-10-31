import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Package,
  X,
  Edit3,
  Save,
} from 'lucide-react';

export default function ProductFormModal({ product, onSubmit, onClose }) {
  const isEditing = Boolean(product);

  const [form, setForm] = useState(() => {
    if (product) {
      const hasOdoo = Boolean(
        product.hasOdooVariant ||
        product.variants?.some(v => v.name.toLowerCase().includes('odoo'))
      );
      const customVars = (product.variants || [])
        .filter(v => v.name !== 'Standard Edition' && !v.name.toLowerCase().includes('odoo'))
        .map(v => ({ name: v.name, priceOffset: v.priceOffset }));

      return {
        name: product.name || '',
        type: product.type || 'Software',
        salesPrice: product.salesPrice !== undefined ? String(product.salesPrice) : '',
        costPrice: product.costPrice !== undefined ? String(product.costPrice) : '',
        notes: product.notes || '',
        hasOdooBrand: hasOdoo,
        customVariants: customVars
      };
    }
    return {
      name: '',
      type: 'Software',
      salesPrice: '',
      costPrice: '',
      notes: '',
      hasOdooBrand: false,
      customVariants: []
    };
  });

  const [errors, setErrors] = useState({});

  const addCustomVariant = () =>
    setForm(f => ({ ...f, customVariants: [...f.customVariants, { name: '', priceOffset: 0 }] }));

  const updateCustomVariant = (i, field, value) => {
    const updated = [...form.customVariants];
    if (field === 'priceOffset') {
      if (value === '') {
        updated[i][field] = '';
      } else {
        const p = parseFloat(value);
        updated[i][field] = isNaN(p) ? 0 : Math.max(0, p);
      }
    } else {
      updated[i][field] = value;
    }
    setForm(f => ({ ...f, customVariants: updated }));
  };

  const removeCustomVariant = (i) =>
    setForm(f => ({ ...f, customVariants: f.customVariants.filter((_, idx) => idx !== i) }));

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Product name is required.';
    const sPrice = parseFloat(form.salesPrice);
    if (form.salesPrice === '' || isNaN(sPrice)) e.salesPrice = 'Sales price is required.';
    else if (sPrice < 0) e.salesPrice = 'Sales price cannot be negative.';

    const cPrice = parseFloat(form.costPrice);
    if (form.costPrice === '' || isNaN(cPrice)) e.costPrice = 'Cost price is required.';
    else if (cPrice < 0) e.costPrice = 'Cost price cannot be negative.';

    for (let i = 0; i < form.customVariants.length; i++) {
      const cv = form.customVariants[i];
      if (cv.priceOffset !== '' && parseFloat(cv.priceOffset) < 0) {
        e.variants = 'Variant price offset cannot be negative.';
        break;
      }
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const sPrice = Math.max(0, parseFloat(form.salesPrice) || 0);
    const cPrice = Math.max(0, parseFloat(form.costPrice) || 0);

    const variants = [{ name: 'Standard Edition', priceOffset: 0 }];
    if (form.hasOdooBrand) {
      variants.push({ name: 'Odoo Brand Edition', priceOffset: 560 });
    }
    form.customVariants.forEach(cv => {
      if (cv.name.trim()) {
        variants.push({
          name: cv.name.trim(),
          priceOffset: Math.max(0, parseFloat(cv.priceOffset) || 0)
        });
      }
    });

    onSubmit({
      name: form.name.trim(),
      type: form.type,
      salesPrice: sPrice,
      costPrice: cPrice,
      notes: form.notes.trim(),
      hasOdooVariant: form.hasOdooBrand,
      odooPriceOffset: 560,
      variants
    });
  };

  return createPortal(
    <div className="modal-overlay billing-overlay" onClick={onClose}>
      <div className="modal-card animate-fade-in" onClick={e => e.stopPropagation()} style={{ maxWidth: '680px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '10px',
            background: 'linear-gradient(135deg, var(--primary), #6366f1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff'
          }}>
            {isEditing ? <Edit3 size={18} /> : <Package size={18} />}
          </div>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>
              {isEditing ? 'Edit Product Details & Variants' : 'Create New Product'}
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              {isEditing ? `Modifying "${product.name}"` : 'You can add billing plans after creating the product.'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '5px' }}>
              Product Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. CRM Software, Inventory Management..."
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="neu-inset neu-input"
            />
            {errors.name && <p style={{ color: 'var(--error)', fontSize: '0.75rem', marginTop: '3px' }}>{errors.name}</p>}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '5px' }}>Type</label>
              <select
                value={form.type}
                onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
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
                min="0"
                required
                placeholder="2000.00"
                value={form.salesPrice}
                onChange={e => {
                  const val = e.target.value;
                  if (val === '' || parseFloat(val) >= 0) {
                    setForm(f => ({ ...f, salesPrice: val }));
                  }
                }}
                onKeyDown={e => ['-', '+', 'e', 'E'].includes(e.key) && e.preventDefault()}
                className="neu-inset neu-input"
              />
              {errors.salesPrice && <p style={{ color: 'var(--error)', fontSize: '0.75rem', marginTop: '3px' }}>{errors.salesPrice}</p>}
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '5px' }}>Cost Price (₹) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                placeholder="850.00"
                value={form.costPrice}
                onChange={e => {
                  const val = e.target.value;
                  if (val === '' || parseFloat(val) >= 0) {
                    setForm(f => ({ ...f, costPrice: val }));
                  }
                }}
                onKeyDown={e => ['-', '+', 'e', 'E'].includes(e.key) && e.preventDefault()}
                className="neu-inset neu-input"
              />
              {errors.costPrice && <p style={{ color: 'var(--error)', fontSize: '0.75rem', marginTop: '3px' }}>{errors.costPrice}</p>}
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '5px' }}>Notes</label>
            <textarea
              rows="2"
              placeholder="Product description, licensing specs, SLA..."
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              className="neu-inset neu-input"
              style={{ resize: 'none' }}
            />
          </div>

          {/* Odoo Brand Variant */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input
              type="checkbox"
              id="odooBrandCheckbox"
              checked={form.hasOdooBrand}
              onChange={e => setForm(f => ({ ...f, hasOdooBrand: e.target.checked }))}
              style={{ accentColor: 'var(--primary)', width: '15px', height: '15px', cursor: 'pointer' }}
            />
            <label htmlFor="odooBrandCheckbox" style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--text-main)', cursor: 'pointer' }}>
              Odoo Brand Variant
            </label>
            {form.hasOdooBrand && (
              <span style={{ fontSize: '0.78rem', color: '#5b21b6', fontWeight: 700 }}>
                (+₹560 added to plan price for Odoo edition)
              </span>
            )}
          </div>

          {/* Custom Variants */}
          <div style={{ borderTop: '1px solid rgba(184,194,204,0.3)', paddingTop: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  Product Variants
                </label>
                <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                  Define custom editions or tiers with additional price offsets.
                </p>
              </div>
              <button type="button" onClick={addCustomVariant} className="neu-btn" style={{ padding: '4px 10px', fontSize: '0.76rem' }}>
                + Add Variant
              </button>
            </div>

            {form.customVariants.length === 0 ? (
              <p style={{ fontSize: '0.77rem', color: 'var(--text-muted)', background: 'rgba(184,194,204,0.1)', padding: '10px 12px', borderRadius: '8px' }}>
                Standard Edition (+₹0) {form.hasOdooBrand ? 'and Odoo Brand Edition (+₹560) ' : ''}will be available for this product. Click <strong>+ Add Variant</strong> above to define additional custom editions.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {form.customVariants.map((v, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr auto', gap: '8px', alignItems: 'center' }}>
                    <input
                      type="text"
                      placeholder="Variant Name (e.g. Enterprise Edition)"
                      value={v.name}
                      onChange={e => updateCustomVariant(i, 'name', e.target.value)}
                      className="neu-inset neu-input"
                      style={{ padding: '8px 12px', fontSize: '0.82rem' }}
                    />
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Price Offset (+₹)"
                      value={v.priceOffset}
                      onChange={e => {
                        const val = e.target.value;
                        if (val === '' || parseFloat(val) >= 0) {
                          updateCustomVariant(i, 'priceOffset', val);
                        }
                      }}
                      onKeyDown={e => ['-', '+', 'e', 'E'].includes(e.key) && e.preventDefault()}
                      className="neu-inset neu-input"
                      style={{ padding: '8px 12px', fontSize: '0.82rem' }}
                    />
                    <button type="button" onClick={() => removeCustomVariant(i)} className="neu-btn" style={{ padding: '8px', color: 'var(--error)' }} title="Remove variant">
                      <X size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {errors.variants && <p style={{ color: 'var(--error)', fontSize: '0.75rem', marginTop: '5px' }}>{errors.variants}</p>}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '4px' }}>
            <button type="button" onClick={onClose} className="neu-btn" style={{ padding: '10px 18px' }}>
              Cancel
            </button>
            <button type="submit" className="neu-btn-primary" style={{ padding: '10px 22px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Save size={15} />
              {isEditing ? 'Save Changes' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>, document.body
  );
}
