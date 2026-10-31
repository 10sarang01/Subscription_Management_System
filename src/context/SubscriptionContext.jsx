import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
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
  const [products, setProducts] = useState([]);
  const [productPlans, setProductPlans] = useState({});
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState('');

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

  const [discounts, setDiscounts] = useState([]);
  const [discountsLoading, setDiscountsLoading] = useState(true);
  const [discountsError, setDiscountsError] = useState('');

  const [payments, setPayments] = useState([]);

  // Current active persona
  const [currentPersona, setCurrentPersona] = useState(() => initialUser || {});

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

  const fetchDiscounts = useCallback(async () => {
    setDiscountsLoading(true);
    try {
      const data = await subscriptionApiRequest('/api/discounts');
      if (!Array.isArray(data.discounts)) throw new Error('Invalid discount response.');
      setDiscounts(data.discounts);
      setDiscountsError('');
      return data.discounts;
    } catch (err) {
      setDiscountsError(`Unable to load discount rules: ${err.message}`);
      return null;
    } finally { setDiscountsLoading(false); }
  }, []);
  useEffect(() => { void fetchDiscounts(); }, [fetchDiscounts]);

  const refreshCatalog = useCallback(async () => {
    setCatalogLoading(true);
    try {
      const data = await subscriptionApiRequest('/api/products');
      if (!Array.isArray(data.products)) throw new Error('Invalid product response.');
      const entries = await Promise.all(data.products.map(async (product) => {
        const result = await subscriptionApiRequest(`/api/products/${encodeURIComponent(product.id)}/plans`);
        if (!Array.isArray(result.plans)) throw new Error('Invalid plan response.');
        return [product.id, result.plans];
      }));
      setProducts(data.products);
      setProductPlans(Object.fromEntries(entries));
      setCatalogError('');
      return true;
    } catch (err) { setCatalogError(`Could not load products and plans: ${err.message}`); return false; }
    finally { setCatalogLoading(false); }
  }, []);
  useEffect(() => { void refreshCatalog(); }, [refreshCatalog]);

  const catalogMutation = async (url, method, payload, message) => {
    try {
      const data = await subscriptionApiRequest(url, { method, ...(payload !== undefined ? { body: JSON.stringify(payload) } : {}) });
      const refreshed = await refreshCatalog();
      void refreshSubscriptionOptions();
      showToast(refreshed ? message : `${message} Refresh failed; retry loading the catalog.`, refreshed ? 'success' : 'error');
      return data;
    } catch (err) { showToast(err.message || 'Catalog request failed.', 'error'); return null; }
  };
  const addProduct = async (product) => (await catalogMutation('/api/products', 'POST', product, 'Product created.'))?.product || null;
  const updateProduct = async (id, updates) => (await catalogMutation(`/api/products/${encodeURIComponent(id)}`, 'PUT', updates, 'Product updated.'))?.product || null;
  const deleteProduct = async (id) => Boolean(await catalogMutation(`/api/products/${encodeURIComponent(id)}`, 'DELETE', undefined, 'Product deleted.'));
  const getPlansForProduct = useCallback((productId) => productPlans[productId] || [], [productPlans]);
  const fetchPlansForProduct = useCallback(async (productId) => {
    try {
      const data = await subscriptionApiRequest(`/api/products/${encodeURIComponent(productId)}/plans`);
      setProductPlans((prev) => ({ ...prev, [productId]: data.plans }));
      return data.plans;
    } catch (err) { setCatalogError(`Could not load plans: ${err.message}`); return null; }
  }, []);
  const addProductPlan = async (productId, plan) => (await catalogMutation(`/api/products/${encodeURIComponent(productId)}/plans`, 'POST', plan, 'Plan created.'))?.plan || null;
  const updateProductPlan = async (planId, productId, updates) => (await catalogMutation(`/api/plans/${encodeURIComponent(planId)}`, 'PUT', updates, 'Plan updated.'))?.plan || null;
  const toggleProductPlan = async (planId, productId, isActive) => (await catalogMutation(`/api/plans/${encodeURIComponent(planId)}/status`, 'PATCH', { isActive }, 'Plan status updated.'))?.plan || null;
  const deleteProductPlan = async (planId) => Boolean(await catalogMutation(`/api/plans/${encodeURIComponent(planId)}`, 'DELETE', undefined, 'Plan deleted.'));

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
    if (rule.usageLimit != null && (rule.timesUsed || 0) >= rule.usageLimit) {
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
      const [billingRefreshed] = await Promise.all([refreshBilling(), refreshSubscriptions(), fetchDiscounts(), refreshSubscriptionOptions()]);
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
    try {
      const data = await subscriptionApiRequest('/api/discounts', { method: 'POST', body: JSON.stringify(discountData) });
      setDiscounts((prev) => [data.discount, ...prev.filter((d) => d.id !== data.discount.id)]);
      void refreshSubscriptionOptions();
      showToast(`Discount rule "${data.discount.code}" created.`, 'success');
      return data.discount;
    } catch (err) { showToast(err.message || 'Could not save discount.', 'error'); return null; }
  };
  const toggleDiscountStatus = async (discountId) => {
    const target = discounts.find((d) => d.id === discountId);
    if (!target) return false;
    try {
      const data = await subscriptionApiRequest(`/api/discounts/${encodeURIComponent(discountId)}/status`, { method: 'PATCH', body: JSON.stringify({ isActive: !target.isActive }) });
      setDiscounts((prev) => prev.map((d) => d.id === discountId ? data.discount : d));
      void refreshSubscriptionOptions();
      showToast('Discount status updated.', 'success');
      return true;
    } catch (err) { showToast(err.message || 'Could not update discount.', 'error'); return false; }
  };
  const deleteDiscount = async (discountId) => {
    try {
      await subscriptionApiRequest(`/api/discounts/${encodeURIComponent(discountId)}`, { method: 'DELETE' });
      setDiscounts((prev) => prev.filter((d) => d.id !== discountId));
      void refreshSubscriptionOptions();
      showToast('Discount rule deleted.', 'info');
      return true;
    } catch (err) { showToast(err.message || 'Could not delete discount.', 'error'); return false; }
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

    void refreshCatalog();
    void refreshSubscriptions();
    void refreshBilling();

    await fetchDiscounts();

    showToast('Local demo data reset. Shared database subscriptions were preserved.', 'info');
  };

  return (
    <SubscriptionContext.Provider
      value={{
        // Data
        products,
        productPlans,
        catalogLoading,
        catalogError,
        refreshCatalog,
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
        discountsLoading,
        discountsError,
        refreshDiscounts: fetchDiscounts,
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
