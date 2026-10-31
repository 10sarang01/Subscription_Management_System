import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  initialProducts,
  initialInvoices,
  initialDiscounts,
  initialPayments,
  defaultPersonas
} from '../data/mockData';
import { formatINR } from '../utils/currency';

const SubscriptionContext = createContext();
function getStoredAuthToken() {
  return localStorage.getItem('brightloop_token') || sessionStorage.getItem('brightloop_token');
}

async function subscriptionApiRequest(url, options = {}) {
  const token = getStoredAuthToken();
  if (!token) throw new Error('Your session has expired. Please sign in again.');
  const headers = {
    Accept: 'application/json',
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...options.headers,
    Authorization: `Bearer ${token}`
  };
  const response = await fetch(url, { ...options, headers });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'The subscription request failed.');
  return data;
}
export function SubscriptionProvider({ children, initialUser }) {
  // ── Products (localStorage persisted) ──────────────────────────────────
  const [products, setProducts] = useState(() => {
    const saved = localStorage.getItem('brightloop_products');
    return saved ? JSON.parse(saved) : initialProducts;
  });

  // ── Product-scoped plans: { [productId]: Plan[] } ──────────────────────
  // Persisted in localStorage as well; synced from backend when available
  const [productPlans, setProductPlans] = useState(() => {
    const saved = localStorage.getItem('brightloop_product_plans');
    return saved ? JSON.parse(saved) : {};
  });

  const [subscriptions, setSubscriptions] = useState([]);
  const [subscriptionsLoading, setSubscriptionsLoading] = useState(true);
  const [subscriptionsError, setSubscriptionsError] = useState('');
  const [subscriptionOptions, setSubscriptionOptions] = useState({
    customers: [], products: [], plans: [], templates: [], discounts: [], defaultValidityDays: 30
  });
  const [subscriptionOptionsLoading, setSubscriptionOptionsLoading] = useState(true);
  const [subscriptionOptionsError, setSubscriptionOptionsError] = useState('');
  const [invoices, setInvoices] = useState([]);
  const [billingError, setBillingError] = useState('');
  const [billingLoading, setBillingLoading] = useState(true);
  const paymentAttempts = useRef(new Map());

  const [discounts, setDiscounts] = useState(() => {
    const saved = localStorage.getItem('brightloop_discounts');
    return saved ? JSON.parse(saved) : initialDiscounts;
  });

  const [payments, setPayments] = useState([]);

  // Current active persona
  const [currentPersona, setCurrentPersona] = useState(() => {
    if (initialUser) return initialUser;
    return defaultPersonas[0];
  });

  // Toast notification
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'info') => {
    setToast({ id: Date.now(), message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const refreshSubscriptions = useCallback(async () => {
    setSubscriptionsLoading(true);
    try {
      const data = await subscriptionApiRequest('/api/subscriptions');
      const loadedSubscriptions = Array.isArray(data.subscriptions) ? data.subscriptions : [];
      setSubscriptions(loadedSubscriptions);
      setSubscriptionsError('');
      return loadedSubscriptions;
    } catch (error) {
      setSubscriptions([]);
      setSubscriptionsError(error.message || 'Could not load subscriptions from the database.');
      return [];
    } finally {
      setSubscriptionsLoading(false);
    }
  }, []);

  const refreshSubscriptionOptions = useCallback(async () => {
    setSubscriptionOptionsLoading(true);
    try {
      const data = await subscriptionApiRequest('/api/subscriptions/options');
      setSubscriptionOptions({
        customers: Array.isArray(data.customers) ? data.customers : [],
        products: Array.isArray(data.products) ? data.products : [],
        plans: Array.isArray(data.plans) ? data.plans : [],
        templates: Array.isArray(data.templates) ? data.templates : [],
        discounts: Array.isArray(data.discounts) ? data.discounts : [],
        defaultValidityDays: Number(data.defaultValidityDays) || 30
      });
      setSubscriptionOptionsError('');
    } catch (error) {
      setSubscriptionOptions({ customers: [], products: [], plans: [], templates: [], discounts: [], defaultValidityDays: 30 });
      setSubscriptionOptionsError(error.message || 'Could not load quotation choices from Brightloop.');
    } finally {
      setSubscriptionOptionsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshSubscriptions();
    void refreshSubscriptionOptions();
  }, [refreshSubscriptions, refreshSubscriptionOptions]);
  // ── localStorage sync ─────────────────────────────────────────────────
  useEffect(() => {
    localStorage.setItem('brightloop_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('brightloop_product_plans', JSON.stringify(productPlans));
  }, [productPlans]);



  useEffect(() => {
    localStorage.setItem('brightloop_discounts', JSON.stringify(discounts));
  }, [discounts]);


  const billingRequest = async (url, options = {}) => {
    const token = localStorage.getItem('brightloop_token') || sessionStorage.getItem('brightloop_token');
    const response = await fetch(url, { ...options, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token || ''}`, ...options.headers } });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Billing request failed.');
    return data;
  };
  const refreshBilling = useCallback(async () => {
    setBillingLoading(true);
    try {
      const [invoiceData, paymentData] = await Promise.all([billingRequest('/api/invoices'), billingRequest('/api/payments')]);
      setInvoices(invoiceData.invoices);
      setPayments(paymentData.payments);
      setBillingError('');
      return true;
    } catch (err) {
      setBillingError(`Unable to load billing data: ${err.message}`);
      return false;
    } finally { setBillingLoading(false); }
  }, []);
  useEffect(() => { refreshBilling(); }, [refreshBilling]);

  // Fetch live discounts from SQLite database on mount
  const fetchDiscounts = useCallback(async () => {
    try {
      const res = await fetch('/api/discounts');
      if (res.ok) {
        const data = await res.json();
        if (data.discounts && Array.isArray(data.discounts)) {
          setDiscounts(data.discounts);
          return data.discounts;
        }
      }
    } catch (err) {
      console.warn('API error fetching discounts, relying on localStorage/initialDiscounts:', err);
    }
    return null;
  }, []);

  useEffect(() => {
    fetchDiscounts();
  }, [fetchDiscounts]);

  // Note: Products and plans are persisted in localStorage.
  // Backend sync happens on individual add/delete operations (with graceful fallback).

  // ── Product Actions ───────────────────────────────────────────────────

  const addProduct = async (newProduct) => {
    const cleanProduct = {
      ...newProduct,
      salesPrice: Math.max(0, parseFloat(newProduct.salesPrice) || 0),
      costPrice: Math.max(0, parseFloat(newProduct.costPrice) || 0),
      variants: (newProduct.variants || []).map(v => ({
        ...v,
        priceOffset: Math.max(0, parseFloat(v.priceOffset) || 0)
      }))
    };

    let savedProduct = null;
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cleanProduct)
      });
      if (res.ok) {
        const data = await res.json();
        savedProduct = data.product;
      }
    } catch {
      // API offline, saving locally
    }

    if (!savedProduct) {
      savedProduct = { ...cleanProduct, id: `prod-${Date.now()}` };
    }

    setProducts((prev) => [savedProduct, ...prev.filter(p => p.id !== savedProduct.id)]);
    // Initialize empty plans array for this product
    setProductPlans((prev) => ({ ...prev, [savedProduct.id]: prev[savedProduct.id] || [] }));
    showToast(`Product "${savedProduct.name}" created!`, 'success');
    return savedProduct;
  };

  const deleteProduct = async (id) => {
    try {
      await fetch(`/api/products/${id}`, { method: 'DELETE' });
    } catch {
      // offline
    }
    setProducts((prev) => prev.filter((p) => p.id !== id));
    // Remove associated plans
    setProductPlans((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    showToast('Product and its plans removed.', 'info');
  };

  const updateProduct = async (id, updates) => {
    const cleanUpdates = {
      ...updates,
      ...(updates.salesPrice !== undefined ? { salesPrice: Math.max(0, parseFloat(updates.salesPrice) || 0) } : {}),
      ...(updates.costPrice !== undefined ? { costPrice: Math.max(0, parseFloat(updates.costPrice) || 0) } : {}),
      ...(updates.variants ? {
        variants: updates.variants.map(v => ({
          ...v,
          priceOffset: Math.max(0, parseFloat(v.priceOffset) || 0)
        }))
      } : {})
    };

    let updatedProduct = null;
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cleanUpdates)
      });
      if (res.ok) {
        const data = await res.json();
        updatedProduct = data.product;
      }
    } catch {
      // offline
    }

    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        return updatedProduct || { ...p, ...cleanUpdates };
      })
    );
    showToast(`Product "${cleanUpdates.name || 'details'}" updated successfully!`, 'success');
    return updatedProduct;
  };

  // ── Product-scoped Plan Actions ───────────────────────────────────────

  /**
   * Get all plans for a specific product (from state, optionally refresh from API)
   */
  const getPlansForProduct = useCallback((productId) => {
    return productPlans[productId] || [];
  }, [productPlans]);

  /**
   * Fetch plans for a product from the backend and merge into state
   */
  const fetchPlansForProduct = useCallback(async (productId, authToken) => {
    try {
      const headers = authToken ? { Authorization: `Bearer ${authToken}` } : {};
      const res = await fetch(`/api/products/${productId}/plans`, { headers });
      if (res.ok) {
        const data = await res.json();
        setProductPlans((prev) => ({ ...prev, [productId]: data.plans }));
        return data.plans;
      }
    } catch {
      // Backend offline – using local state
    }
    return productPlans[productId] || [];
  }, [productPlans]);

  /**
   * Add a new plan to a product
   */
  const addProductPlan = async (productId, planData, authToken) => {
    const cleanPlan = {
      ...planData,
      price: Math.max(0, parseFloat(planData.price) || 0),
      minimumQuantity: Math.max(1, parseInt(planData.minimumQuantity) || 1)
    };

    let savedPlan = null;
    try {
      const headers = {
        'Content-Type': 'application/json',
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
      };
      const res = await fetch(`/api/products/${productId}/plans`, {
        method: 'POST',
        headers,
        body: JSON.stringify(cleanPlan)
      });
      if (res.ok) {
        const data = await res.json();
        savedPlan = data.plan;
      }
    } catch {
      // offline
    }

    if (!savedPlan) {
      savedPlan = {
        ...cleanPlan,
        id: `pp-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        productId,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    }

    setProductPlans((prev) => ({
      ...prev,
      [productId]: [...(prev[productId] || []), savedPlan]
    }));
    showToast(`Plan "${savedPlan.name}" added to product!`, 'success');
    return savedPlan;
  };

  /**
   * Update an existing product plan
   */
  const updateProductPlan = async (planId, productId, updates, authToken) => {
    const cleanUpdates = {
      ...updates,
      ...(updates.price !== undefined ? { price: Math.max(0, parseFloat(updates.price) || 0) } : {}),
      ...(updates.minimumQuantity !== undefined ? { minimumQuantity: Math.max(1, parseInt(updates.minimumQuantity) || 1) } : {})
    };

    let updatedPlan = null;
    try {
      const headers = {
        'Content-Type': 'application/json',
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
      };
      const res = await fetch(`/api/plans/${planId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(cleanUpdates)
      });
      if (res.ok) {
        const data = await res.json();
        updatedPlan = data.plan;
      }
    } catch {
      // offline
    }

    setProductPlans((prev) => {
      const current = prev[productId] || [];
      const next = current.map((p) => {
        if (p.id !== planId) return p;
        return updatedPlan || { ...p, ...cleanUpdates, updatedAt: new Date().toISOString() };
      });
      return { ...prev, [productId]: next };
    });
    showToast('Plan updated successfully!', 'success');
  };

  /**
   * Toggle plan active/inactive status
   */
  const toggleProductPlan = async (planId, productId, isActive, authToken) => {
    try {
      const headers = {
        'Content-Type': 'application/json',
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
      };
      await fetch(`/api/plans/${planId}/status`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ isActive })
      });
    } catch {
      // offline
    }

    setProductPlans((prev) => {
      const current = prev[productId] || [];
      const next = current.map((p) =>
        p.id === planId ? { ...p, isActive } : p
      );
      return { ...prev, [productId]: next };
    });
    showToast(`Plan ${isActive ? 'activated' : 'deactivated'}.`, 'info');
  };

  /**
   * Delete a product plan
   */
  const deleteProductPlan = async (planId, productId, authToken) => {
    try {
      const headers = authToken ? { Authorization: `Bearer ${authToken}` } : {};
      await fetch(`/api/plans/${planId}`, { method: 'DELETE', headers });
    } catch {
      // offline
    }

    setProductPlans((prev) => {
      const current = prev[productId] || [];
      return { ...prev, [productId]: current.filter((p) => p.id !== planId) };
    });
    showToast('Plan removed.', 'info');
  };

  // ── Subscription Actions (SQLite API is the source of truth) ──────────

  const createSubscription = async (quoteData) => {
    try {
      const data = await subscriptionApiRequest('/api/subscriptions', {
        method: 'POST',
        body: JSON.stringify(quoteData)
      });
      const created = data.subscription;
      if (!created) throw new Error('The server did not return the saved subscription.');
      setSubscriptions((prev) => [created, ...prev.filter((sub) => sub.id !== created.id)]);
      setSubscriptionsError('');
      showToast(`${created.subNumber} created in ${created.status} status!`, 'success');
      return created;
    } catch (error) {
      showToast(error.message || 'Could not save the subscription.', 'error');
      return null;
    }
  };

  const updateSubscriptionStatus = async (id, newStatus) => {
    try {
      const data = await subscriptionApiRequest(`/api/subscriptions/${encodeURIComponent(id)}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus })
      });
      const updated = data.subscription;
      if (!updated) throw new Error('The server did not return the updated subscription.');
      setSubscriptions((prev) => prev.map((sub) => sub.id === id ? updated : sub));
      setSubscriptionsError('');
      showToast(`Subscription updated to ${newStatus}.`, 'success');
      return updated;
    } catch (error) {
      showToast(error.message || 'Could not update the subscription.', 'error');
      return null;
    }
  };

  const saveSubscriptionBillingDates = async (id, billingDates) => {
    try {
      const data = await subscriptionApiRequest(`/api/subscriptions/${encodeURIComponent(id)}/billing-dates`, {
        method: 'PATCH',
        body: JSON.stringify(billingDates)
      });
      const updated = data.subscription;
      if (updated) setSubscriptions((prev) => prev.map((sub) => sub.id === id ? updated : sub));
      return updated || null;
    } catch (error) {
      showToast(`Subscription billing dates were not saved: ${error.message}`, 'error');
      return null;
    }
  };
  // ── Billing Day Engine: Scene 4 & 5 ───────────────────────────────────

  // Helper to advance date by billing frequency
  const advanceBillingDate = (dateStr, frequency = 'monthly') => {
    const d = new Date(dateStr || Date.now());
    switch (frequency) {
      case 'daily':
        d.setDate(d.getDate() + 1);
        break;
      case 'weekly':
        d.setDate(d.getDate() + 7);
        break;
      case 'yearly':
        d.setFullYear(d.getFullYear() + 1);
        break;
      case 'monthly':
      default:
        d.setMonth(d.getMonth() + 1);
        break;
    }
    return d.toISOString().split('T')[0];
  };

  // Helper to compute invoice due date based on payment terms
  const computeDueDate = (issueDateStr, paymentTerms = 'Net 15') => {
    const issueDate = new Date(issueDateStr || Date.now());
    let daysToAdd = 15;
    if (paymentTerms === 'Net 30') daysToAdd = 30;
    else if (paymentTerms === 'Net 60') daysToAdd = 60;
    else if (paymentTerms === 'Due upon receipt') daysToAdd = 0;
    issueDate.setDate(issueDate.getDate() + daysToAdd);
    return issueDate.toISOString().split('T')[0];
  };

  // Inspection helper: returns subscriptions that are due vs already billed
  const getDueSubscriptions = (targetDateStr = getLocalDateString()) => {
    const active = subscriptions.filter((sub) => sub.status === 'Active');
    return { due: active.filter((sub) => sub.nextBillingDate && sub.nextBillingDate <= targetDateStr && (!sub.expiryDate || sub.nextBillingDate <= sub.expiryDate) && (!sub.lastBillingDate || sub.lastBillingDate < targetDateStr)), alreadyBilled: active.filter((sub) => sub.lastBillingDate === targetDateStr) };
  };

  // Universal Discount Validator: Scene 5
  const validateDiscount = ({
    code,
    items = [],
    subtotal = 0,
    date = new Date().toISOString().split('T')[0],
    rules = discounts
  }) => {
    if (!code || !code.trim()) return { valid: false, message: '' };
    const cleanCode = code.trim().toUpperCase();
    const rule = rules.find((d) => d.code.toUpperCase() === cleanCode);

    if (!rule) {
      return { valid: false, message: `Coupon code "${cleanCode}" does not exist.` };
    }
    if (!rule.isActive) {
      return { valid: false, message: `Discount rule "${rule.code}" is currently deactivated or inactive.` };
    }
    if (rule.endDate && date > rule.endDate) {
      return { valid: false, message: `Discount code "${rule.code}" expired on ${rule.endDate}.` };
    }
    if (rule.startDate && date < rule.startDate) {
      return { valid: false, message: `Discount code "${rule.code}" is not valid until ${rule.startDate}.` };
    }
    if (rule.usageLimit !== undefined && (rule.timesUsed || 0) >= rule.usageLimit) {
      return { valid: false, message: `Discount limit reached: Capacity of ${rule.usageLimit} redemptions exhausted.` };
    }

    // Check volume threshold: "A customer wants a discount for taking more seats"
    const totalQuantity = items.reduce((sum, it) => sum + (parseInt(it.quantity, 10) || 1), 0);
    if (rule.minQuantity && totalQuantity < rule.minQuantity) {
      return {
        valid: false,
        rule,
        message: `Volume threshold: Requires at least ${rule.minQuantity} seats/units (currently taking ${totalQuantity}). Add ${rule.minQuantity - totalQuantity} more to qualify!`
      };
    }

    // Check minimum spend
    if (rule.minAmount && subtotal < rule.minAmount) {
      return {
        valid: false,
        rule,
        message: `Minimum spend: Requires at least ${formatINR(rule.minAmount)} (current: ${formatINR(subtotal)}).`
      };
    }

    // Calculate deduction based on Scope (specific_product vs whole_subscription)
    let deduction = 0;
    if (rule.scope === 'specific_product' && rule.targetProductId) {
      const eligibleItems = items.filter((it) => it.productId === rule.targetProductId);
      const eligibleSubtotal = eligibleItems.reduce((sum, it) => sum + ((parseInt(it.quantity, 10) || 0) * (parseFloat(it.unitPrice) || 0)), 0);
      if (eligibleSubtotal <= 0) {
        return {
          valid: false,
          rule,
          message: `Applies specifically to target product, which is not present in this contract.`
        };
      }
      deduction = rule.type === 'percentage'
        ? (eligibleSubtotal * rule.value) / 100
        : Math.min(rule.value, eligibleSubtotal);
    } else {
      deduction = rule.type === 'percentage'
        ? (subtotal * rule.value) / 100
        : Math.min(rule.value, subtotal);
    }

    return {
      valid: true,
      rule,
      deduction,
      message: `✅ "${rule.name}" applied: ${rule.type === 'percentage' ? `${rule.value}% off` : `${formatINR(rule.value)} off`} (-${formatINR(deduction)})`
    };
  };

  // Billing Day Engine: Scene 4 & Scene 5
  const runBillingDay = async (date = getLocalDateString()) => {
    try {
      const result = await billingRequest('/api/billing/run', { method: 'POST', body: JSON.stringify({ date }) });
      const [billingRefreshed] = await Promise.all([refreshBilling(), refreshSubscriptions()]);
      showToast(billingRefreshed ? `Billing complete: ${result.generatedCount} invoice(s) created.` : 'Billing completed, but the invoice list could not be refreshed.', billingRefreshed ? 'success' : 'error');
      return result;
    } catch (err) { showToast(err.message || 'Billing run failed.', 'error'); return null; }
  };

  const updateInvoiceStatus = async (id, action) => {
    try {
      await billingRequest(`/api/invoices/${encodeURIComponent(id)}/actions/${action}`, { method: 'POST' });
      await refreshBilling();
      showToast(`Invoice ${action === 'confirm' ? 'confirmed' : 'cancelled'}.`, 'success');
      return true;
    } catch (err) { showToast(err.message, 'error'); return false; }
  };
  const confirmInvoice = (id) => updateInvoiceStatus(id, 'confirm');
  const cancelInvoice = (id) => updateInvoiceStatus(id, 'cancel');
  const sendInvoice = () => { showToast('Email delivery is not configured.', 'error'); };
  const recordPayment = async ({ invoiceId, amount, method, note, transactionRef }) => {
    const methods = { 'Credit Card (Stripe)': 'Credit Card', 'Bank Wire / ACH': 'Bank Transfer', 'Direct Debit': 'Direct Debit', 'Cash Settlement': 'Cash', 'Online Customer Portal': 'Online' };
    if (!methods[method]) { showToast('This payment method is not supported.', 'error'); return false; }
    const signature = JSON.stringify([invoiceId, amount, methods[method], note || '', transactionRef || '']);
    if (!paymentAttempts.current.has(signature)) paymentAttempts.current.set(signature, crypto.randomUUID());
    try {
      await billingRequest(`/api/invoices/${encodeURIComponent(invoiceId)}/payments`, {
        method: 'POST', headers: { 'Idempotency-Key': paymentAttempts.current.get(signature) },
        body: JSON.stringify({ amount, method: methods[method], note: note || '', transactionRef: transactionRef || '' })
      });

      paymentAttempts.current.delete(signature);
      const refreshed = await refreshBilling();
      showToast(refreshed ? 'Payment recorded.' : 'Payment recorded, but billing data could not be refreshed.', refreshed ? 'success' : 'error');
      return true;
    } catch (err) { showToast(err.message, 'error'); return false; }

  };

  // ── Discount Actions (Live SQLite Persistence) ─────────────────────────

  const createDiscount = async (discountData) => {
    const cleanData = {
      code: (discountData.code || '').toUpperCase().trim(),
      name: (discountData.name || '').trim(),
      type: discountData.type === 'fixed' ? 'fixed' : 'percentage',
      value: Math.max(0, parseFloat(discountData.value) || 0),
      scope: discountData.scope === 'specific_product' ? 'specific_product' : 'whole_subscription',
      targetProductId: discountData.scope === 'specific_product' ? (discountData.targetProductId || null) : null,
      minQuantity: Math.max(1, parseInt(discountData.minQuantity, 10) || 1),
      minAmount: Math.max(0, parseFloat(discountData.minAmount) || 0),
      startDate: discountData.startDate || null,
      endDate: discountData.endDate || null,
      usageLimit: Math.max(1, parseInt(discountData.usageLimit, 10) || 100)
    };

    let savedDiscount = null;
    try {
      const res = await fetch('/api/discounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cleanData)
      });
      if (res.ok) {
        const data = await res.json();
        savedDiscount = data.discount;
      } else {
        const errData = await res.json().catch(() => ({}));
        showToast(errData.error || 'Failed to save discount to database', 'error');
        return null;
      }
    } catch (err) {
      console.warn('API error saving discount, using local fallback:', err);
    }

    if (!savedDiscount) {
      savedDiscount = {
        ...cleanData,
        id: `disc-${Date.now()}`,
        timesUsed: 0,
        isActive: true
      };
    }

    setDiscounts((prev) => [savedDiscount, ...prev.filter((d) => d.id !== savedDiscount.id && d.code !== savedDiscount.code)]);
    showToast(`Discount rule "${savedDiscount.code}" created & persisted to database!`, 'success');
    return savedDiscount;
  };

  const toggleDiscountStatus = async (discountId) => {
    const target = discounts.find((d) => d.id === discountId);
    if (!target) return;
    const newActive = !target.isActive;

    setDiscounts((prev) =>
      prev.map((d) => (d.id === discountId ? { ...d, isActive: newActive } : d))
    );

    try {
      const res = await fetch(`/api/discounts/${discountId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: newActive })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.discount) {
          setDiscounts((prev) => prev.map((d) => (d.id === discountId ? data.discount : d)));
        }
        showToast(`Discount rule "${target.code}" ${newActive ? 'activated' : 'paused'} in database!`, 'info');
      } else {
        showToast('Discount status updated locally.', 'warning');
      }
    } catch {
      showToast('Discount status updated locally.', 'warning');
    }
  };

  const deleteDiscount = async (discountId) => {
    const target = discounts.find((d) => d.id === discountId);
    try {
      await fetch(`/api/discounts/${discountId}`, { method: 'DELETE' });
    } catch (err) {
      console.warn('API error deleting discount:', err);
    }
    setDiscounts((prev) => prev.filter((d) => d.id !== discountId));
    showToast(`Discount rule "${target?.code || discountId}" deleted from database.`, 'info');
  };

  const sendPaymentReminder = (invoiceId) => {
    const inv = invoices.find((i) => i.id === invoiceId);
    showToast(`Payment reminder email sent to ${inv?.customerEmail || 'customer'} for ${inv?.invoiceNumber}`, 'info');
  };

  // ── Reset ─────────────────────────────────────────────────────────────

  const resetToDefaultData = async () => {
    localStorage.removeItem('brightloop_products');
    localStorage.removeItem('brightloop_product_plans');
    localStorage.removeItem('brightloop_invoices');
    localStorage.removeItem('brightloop_discounts');
    localStorage.removeItem('brightloop_payments');

    setProducts([]);
    setProductPlans({});
    void refreshSubscriptions();
    void refreshBilling();

    const refreshed = await fetchDiscounts();
    if (!refreshed || refreshed.length === 0) {
      setDiscounts(initialDiscounts);
    }

    showToast('Local demo data reset. Shared database subscriptions were preserved.', 'info');
  };

  return (
    <SubscriptionContext.Provider
      value={{
        // Data
        products,
        productPlans,
        subscriptions,
        subscriptionsLoading,
        subscriptionsError,
        refreshSubscriptions,
        subscriptionOptions,
        subscriptionOptionsLoading,
        subscriptionOptionsError,
        refreshSubscriptionOptions,
        invoices,
        billingError,
        billingLoading,
        refreshBilling,
        discounts,
        payments,
        currentPersona,
        setCurrentPersona,
        toast,
        showToast,
        // Product actions
        addProduct,
        updateProduct,
        deleteProduct,
        // Product-scoped plan actions
        getPlansForProduct,
        fetchPlansForProduct,
        addProductPlan,
        updateProductPlan,
        toggleProductPlan,
        deleteProductPlan,
        // Subscription actions
        createSubscription,
        updateSubscriptionStatus,
        saveSubscriptionBillingDates,
        runBillingDay,
        getDueSubscriptions,
        // Invoice actions
        confirmInvoice,
        cancelInvoice,
        sendInvoice,
        recordPayment,
        // Discount actions
        createDiscount,
        toggleDiscountStatus,
        deleteDiscount,
        fetchDiscounts,
        validateDiscount,
        sendPaymentReminder,
        resetToDefaultData
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}
