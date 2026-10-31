import React, { useState } from 'react';
import {
  Tag,
  Plus,
  Percent,
  DollarSign,
  Calendar,
  Layers,
  Shield,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sliders,
  Sparkles
} from 'lucide-react';
import { useSubscription } from '../context/SubscriptionContext';

export default function DiscountsPage() {
  const { discounts, products, createDiscount, currentPersona } = useSubscription();

  const [showModal, setShowModal] = useState(false);
  const isAdmin = currentPersona.role === 'admin';

  // Simulator State
  const [simSeats, setSimSeats] = useState(6);
  const [simBasePrice, setSimBasePrice] = useState(240);
  const [simDiscountCode, setSimDiscountCode] = useState(discounts[0]?.code || 'ENTERPRISE20');

  // New Discount Form State
  const [discountForm, setDiscountForm] = useState({
    code: '',
    name: '',
    type: 'percentage', // percentage | fixed
    value: 15,
    scope: 'whole_subscription', // whole_subscription | specific_product
    targetProductId: products[0]?.id || 'prod-1',
    minQuantity: 1,
    minAmount: 0,
    startDate: new Date().toISOString().split('T')[0],
    endDate: '2026-12-31',
    usageLimit: 50
  });

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    createDiscount({
      code: discountForm.code.toUpperCase().trim(),
      name: discountForm.name.trim(),
      type: discountForm.type,
      value: parseFloat(discountForm.value) || 0,
      scope: discountForm.scope,
      targetProductId: discountForm.scope === 'specific_product' ? discountForm.targetProductId : null,
      minQuantity: parseInt(discountForm.minQuantity) || 1,
      minAmount: parseFloat(discountForm.minAmount) || 0,
      startDate: discountForm.startDate,
      endDate: discountForm.endDate,
      usageLimit: parseInt(discountForm.usageLimit) || 100
    });
    setDiscountForm({
      code: '',
      name: '',
      type: 'percentage',
      value: 15,
      scope: 'whole_subscription',
      targetProductId: products[0]?.id || 'prod-1',
      minQuantity: 1,
      minAmount: 0,
      startDate: new Date().toISOString().split('T')[0],
      endDate: '2026-12-31',
      usageLimit: 50
    });
    setShowModal(false);
  };

  // Run simulation calculation
  const selectedRule = discounts.find((d) => d.code === simDiscountCode);
  const subtotalBeforeDiscount = simSeats * simBasePrice;
  let simulatedDeduction = 0;
  let eligibilityMessage = 'Discount applied successfully!';
  let isEligible = true;

  if (!selectedRule) {
    isEligible = false;
    eligibilityMessage = 'Coupon code does not exist.';
  } else if (!selectedRule.isActive) {
    isEligible = false;
    eligibilityMessage = 'This discount rule is currently deactivated or expired.';
  } else if (selectedRule.timesUsed >= selectedRule.usageLimit) {
    isEligible = false;
    eligibilityMessage = 'Usage limit has been completely exhausted.';
  } else if (simSeats < selectedRule.minQuantity) {
    isEligible = false;
    eligibilityMessage = `Minimum requirement not met: Requires at least ${selectedRule.minQuantity} seats (current: ${simSeats}).`;
  } else if (subtotalBeforeDiscount < selectedRule.minAmount) {
    isEligible = false;
    eligibilityMessage = `Minimum spend not met: Requires at least $${selectedRule.minAmount} (current: $${subtotalBeforeDiscount}).`;
  } else {
    if (selectedRule.type === 'percentage') {
      simulatedDeduction = (subtotalBeforeDiscount * selectedRule.value) / 100;
    } else {
      simulatedDeduction = Math.min(selectedRule.value, subtotalBeforeDiscount);
    }
  }

  const simulatedFinalTotal = subtotalBeforeDiscount - simulatedDeduction;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      
      {/* Top Banner */}
      <div className="neu-flat" style={{ padding: '24px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Scene 5: Discount & Pricing Engine
          </span>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, marginTop: '4px', color: 'var(--text-main)' }}>
            Automated Discount Rules & Coupons
          </h2>
          <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Rules for percentage / fixed discounts with seat minimums, validity periods, and automated next-invoice deduction.
          </p>
        </div>

        {isAdmin ? (
          <button
            onClick={() => setShowModal(true)}
            className="neu-btn-primary"
            style={{ padding: '10px 20px', fontSize: '0.86rem' }}
          >
            <Plus size={16} /> Create Discount Rule
          </button>
        ) : (
          <div className="neu-inset-sm" style={{ padding: '8px 14px', fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Shield size={16} style={{ color: 'var(--primary)' }} />
            <span>"Only the admin can create discount rules" (Brightloop Policy)</span>
          </div>
        )}
      </div>

      {/* Two Column Section: Live Simulator & Rules List */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
        
        {/* Interactive Discount Simulator */}
        <div className="neu-flat" style={{ padding: '26px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <div className="neu-flat-sm" style={{ width: '38px', height: '38px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
              <Sparkles size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Automated Next-Invoice Simulator</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Test how discounts apply autonomously without manual human intervention
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                Select Active Discount Rule
              </label>
              <select
                value={simDiscountCode}
                onChange={(e) => setSimDiscountCode(e.target.value)}
                className="neu-inset neu-input"
              >
                {discounts.map((d) => (
                  <option key={d.id} value={d.code}>
                    {d.code} — {d.name} ({d.type === 'percentage' ? `${d.value}%` : `$${d.value}`} off)
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  Seats Count (Customer Size)
                </label>
                <input
                  type="number"
                  min="1"
                  value={simSeats}
                  onChange={(e) => setSimSeats(parseInt(e.target.value) || 1)}
                  className="neu-inset neu-input"
                />
              </div>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  Base Price per Seat ($)
                </label>
                <input
                  type="number"
                  min="1"
                  value={simBasePrice}
                  onChange={(e) => setSimBasePrice(parseFloat(e.target.value) || 0)}
                  className="neu-inset neu-input"
                />
              </div>
            </div>

            {/* Simulation Results Card */}
            <div className="neu-inset-sm" style={{ padding: '16px', marginTop: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.86rem', color: 'var(--text-muted)' }}>
                <span>Subtotal ({simSeats} seats @ ${simBasePrice}):</span>
                <strong>${subtotalBeforeDiscount.toFixed(2)}</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.86rem', marginTop: '6px', color: isEligible ? 'var(--success)' : 'var(--error)' }}>
                <span>Discount Deduction:</span>
                <strong>{isEligible ? `-$${simulatedDeduction.toFixed(2)}` : '$0.00'}</strong>
              </div>

              <div style={{ height: '1px', background: 'rgba(184, 194, 204, 0.4)', margin: '10px 0' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)' }}>
                <span>Simulated Invoice Total:</span>
                <span>${simulatedFinalTotal.toFixed(2)}</span>
              </div>

              <div style={{ marginTop: '10px', fontSize: '0.78rem', color: isEligible ? '#15803d' : '#b91c1c', display: 'flex', alignItems: 'center', gap: '6px' }}>
                {isEligible ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
                <span>{eligibilityMessage}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Rule Policy Summary Notice */}
        <div className="neu-flat" style={{ padding: '26px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '6px' }}>
              Autonomous Discount Lifecycle
            </h3>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '16px' }}>
              According to Brightloop specifications, once a discount rule is configured, it automatically reflects on recurring invoices until it reaches either:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.84rem' }}>
              <div className="neu-inset-sm" style={{ padding: '12px 14px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                <Calendar size={18} style={{ color: 'var(--primary)' }} />
                <span><strong>Expiration Date:</strong> Rule automatically ceases after the specified date.</span>
              </div>

              <div className="neu-inset-sm" style={{ padding: '12px 14px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                <Sliders size={18} style={{ color: 'var(--primary)' }} />
                <span><strong>Usage Capacity:</strong> Rule expires as soon as max redemption limit is hit.</span>
              </div>

              <div className="neu-inset-sm" style={{ padding: '12px 14px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                <Shield size={18} style={{ color: 'var(--primary)' }} />
                <span><strong>Seat Minimums:</strong> Evaluates order line quantities before activating.</span>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '20px', padding: '12px', borderRadius: '10px', background: '#ede9fe', color: '#5b21b6', fontSize: '0.8rem', fontWeight: 600 }}>
            👑 Admin Authority: Elena Vance is currently authorized to modify global rules.
          </div>
        </div>

      </div>

      {/* Rules Directory Table */}
      <div className="neu-flat" style={{ padding: '28px 30px' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '16px' }}>
          Configured Discount Rules ({discounts.length})
        </h3>

        <div className="table-container">
          <table className="neu-table">
            <thead>
              <tr>
                <th>Rule Code & Name</th>
                <th>Discount Value</th>
                <th>Scope</th>
                <th>Minimum Criteria</th>
                <th>Validity Dates</th>
                <th>Usage Limit & Capacity</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {discounts.map((d) => {
                const usagePercent = Math.min(100, Math.round((d.timesUsed / d.usageLimit) * 100));
                return (
                  <tr key={d.id} className="table-row">
                    <td>
                      <div style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '0.94rem' }}>
                        {d.code}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{d.name}</div>
                    </td>
                    <td style={{ fontWeight: 800, fontSize: '1rem' }}>
                      {d.type === 'percentage' ? `${d.value}% Off` : `$${d.value}.00 Off`}
                    </td>
                    <td style={{ fontSize: '0.82rem', textTransform: 'capitalize' }}>
                      {d.scope.replace('_', ' ')}
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      <div>Min Seats: <strong>{d.minQuantity}</strong></div>
                      {d.minAmount > 0 && <div>Min Spend: <strong>${d.minAmount}</strong></div>}
                    </td>
                    <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      <div>{d.startDate}</div>
                      <div>to {d.endDate}</div>
                    </td>
                    <td style={{ minWidth: '160px' }}>
                      <div style={{ fontSize: '0.78rem', fontWeight: 700, display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span>{d.timesUsed} / {d.usageLimit} redeemed</span>
                        <span>{usagePercent}%</span>
                      </div>
                      <div style={{ height: '6px', background: '#cbd5e1', borderRadius: '999px', overflow: 'hidden' }}>
                        <div
                          style={{
                            height: '100%',
                            width: `${usagePercent}%`,
                            background: usagePercent >= 100 ? 'var(--error)' : 'var(--primary)',
                            borderRadius: '999px'
                          }}
                        />
                      </div>
                    </td>
                    <td>
                      {d.timesUsed >= d.usageLimit ? (
                        <span className="status-pill status-closed">Exhausted</span>
                      ) : d.isActive ? (
                        <span className="status-pill status-active">Active</span>
                      ) : (
                        <span className="status-pill status-closed">Expired</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: New Discount Rule (Admin Restricted) */}
      {showModal && isAdmin && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-card animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '6px' }}>
              Create New Discount Rule
            </h3>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
              Admin rule setup for volume deals, coupons, and partner promotions.
            </p>

            <form onSubmit={handleCreateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                    Discount Code (e.g. VIP25)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ENTERPRISE25"
                    value={discountForm.code}
                    onChange={(e) => setDiscountForm({ ...discountForm, code: e.target.value })}
                    className="neu-inset neu-input"
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                    Rule Description / Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Volume Growth Bonus"
                    value={discountForm.name}
                    onChange={(e) => setDiscountForm({ ...discountForm, name: e.target.value })}
                    className="neu-inset neu-input"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                    Type
                  </label>
                  <select
                    value={discountForm.type}
                    onChange={(e) => setDiscountForm({ ...discountForm, type: e.target.value })}
                    className="neu-inset neu-input"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount ($)</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                    Value ({discountForm.type === 'percentage' ? '%' : '$'})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={discountForm.value}
                    onChange={(e) => setDiscountForm({ ...discountForm, value: e.target.value })}
                    className="neu-inset neu-input"
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                    Scope
                  </label>
                  <select
                    value={discountForm.scope}
                    onChange={(e) => setDiscountForm({ ...discountForm, scope: e.target.value })}
                    className="neu-inset neu-input"
                  >
                    <option value="whole_subscription">Whole Subscription</option>
                    <option value="specific_product">Specific Product Only</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                    Min Seat Quantity
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={discountForm.minQuantity}
                    onChange={(e) => setDiscountForm({ ...discountForm, minQuantity: e.target.value })}
                    className="neu-inset neu-input"
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                    Min Purchase ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={discountForm.minAmount}
                    onChange={(e) => setDiscountForm({ ...discountForm, minAmount: e.target.value })}
                    className="neu-inset neu-input"
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                    Usage Limit (Max Uses)
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={discountForm.usageLimit}
                    onChange={(e) => setDiscountForm({ ...discountForm, usageLimit: e.target.value })}
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
                    value={discountForm.startDate}
                    onChange={(e) => setDiscountForm({ ...discountForm, startDate: e.target.value })}
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
                    value={discountForm.endDate}
                    onChange={(e) => setDiscountForm({ ...discountForm, endDate: e.target.value })}
                    className="neu-inset neu-input"
                  />
                </div>
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
                  className="neu-btn-primary"
                  style={{ padding: '10px 22px', fontSize: '0.86rem' }}
                >
                  Publish Discount Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
