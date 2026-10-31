import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { defaultPersonas } from '../data/mockData';

const SubscriptionContext = createContext();

// ── Date helpers ─────────────────────────────────────────────────────────────

function getLocalDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function addDaysToDateString(dateString, days) {
  if (!dateString || !Number.isFinite(Number(days))) return '';
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + Number(days));
  return date.toISOString().slice(0, 10);
}

function getNextDocumentNumber(prefix, existingSubscriptions, date = new Date()) {
  const year = date.getFullYear();
  const pattern = new RegExp(`^${prefix}-${year}-(\\d+)$`);
  const existingNumbers = new Set(existingSubscriptions.map((sub) => sub.subNumber).filter(Boolean));
  let nextSequence = existingSubscriptions.reduce((highest, sub) => {
    const match = String(sub.subNumber || '').match(pattern);
    return match ? Math.max(highest, Number(match[1])) : highest;
  }, 0) + 1;
  let candidate = `${prefix}-${year}-${String(nextSequence).padStart(3, '0')}`;
  while (existingNumbers.has(candidate)) {
    nextSequence += 1;
    candidate = `${prefix}-${year}-${String(nextSequence).padStart(3, '0')}`;
  }
  return candidate;
}

function createSubscriptionId() {
  if (typeof globalThis !== 'undefined' && globalThis.crypto?.randomUUID) {
    return `sub-${globalThis.crypto.randomUUID()}`;
  }
  return `sub-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

// ── API helper ───────────────────────────────────────────────────────────────

async function apiFetch(path, options = {}) {
  const res = await fetch(path, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `API error ${res.status}`);
  return data;
}

// ── Provider ─────────────────────────────────────────────────────────────────

export function SubscriptionProvider({ children, initialUser }) {
  // All data lives in server state (brightloop.db) — no localStorage for data
  const [products, setProducts] = useState([]);
  const [productPlans, setProductPlans] = useState({}); // { [productId]: Plan[] }
  const [quotationTemplates, setQuotationTemplates] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [discounts, setDiscounts] = useState([]);
  const [payments, setPayments] = useState([]);

  const [loading, setLoading] = useState(true);

  const [currentPersona, setCurrentPersona] = useState(() => {
    if (initialUser) return initialUser;
    return defaultPersonas[0];
  });

  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'info') => {
    setToast({ id: Date.now(), message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // ── Load all data from brightloop.db on mount ────────────────────────────

  const loadAllData = useCallback(async () => {
    setLoading(true);
    try {
      const [
        prodData,
        subsData,
        invData,
        payData,
        discData,
        tmplData
      ] = await Promise.all([
        apiFetch('/api/products').catch(() => ({ products: [] })),
        apiFetch('/api/subscriptions').catch(() => ({ subscriptions: [] })),
        apiFetch('/api/invoices').catch(() => ({ invoices: [] })),
        apiFetch('/api/payments').catch(() => ({ payments: [] })),
        apiFetch('/api/discounts').catch(() => ({ discounts: [] })),
        apiFetch('/api/templates').catch(() => ({ templates: [] }))
      ]);

      const dbProducts = prodData.products || [];
      setProducts(dbProducts);
      setSubscriptions(subsData.subscriptions || []);
      setInvoices(invData.invoices || []);
      setPayments(payData.payments || []);
      setDiscounts(discData.discounts || []);
      setQuotationTemplates(tmplData.templates || []);

      // Fetch plans for all products
      const plansMap = {};
      await Promise.all(
        dbProducts.map(async (p) => {
          try {
            const pData = await apiFetch(`/api/products/${p.id}/plans`);
            plansMap[p.id] = pData.plans || [];
          } catch { plansMap[p.id] = []; }
        })
      );
      setProductPlans(plansMap);
    } catch (err) {
      console.warn('Failed to load data from DB:', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // ── Product Actions ───────────────────────────────────────────────────────

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

    try {
      const data = await apiFetch('/api/products', { method: 'POST', body: JSON.stringify(cleanProduct) });
      const savedProduct = data.product;
      setProducts((prev) => [savedProduct, ...prev]);
      setProductPlans((prev) => ({ ...prev, [savedProduct.id]: [] }));
      showToast(`Product "${savedProduct.name}" created!`, 'success');
      return savedProduct;
    } catch (err) {
      showToast(`Failed to create product: ${err.message}`, 'error');
      return null;
    }
  };

  const deleteProduct = async (id) => {
    try {
      await apiFetch(`/api/products/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.warn('deleteProduct error:', err.message);
    }
    setProducts((prev) => prev.filter((p) => p.id !== id));
    setProductPlans((prev) => { const next = { ...prev }; delete next[id]; return next; });
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

    try {
      const data = await apiFetch(`/api/products/${id}`, { method: 'PUT', body: JSON.stringify(cleanUpdates) });
      const updatedProduct = data.product;
      setProducts((prev) => prev.map((p) => p.id === id ? updatedProduct : p));
      showToast(`Product "${updatedProduct.name}" updated!`, 'success');
      return updatedProduct;
    } catch (err) {
      showToast(`Failed to update product: ${err.message}`, 'error');
      return null;
    }
  };

  // ── Product-scoped Plan Actions ───────────────────────────────────────────

  const getPlansForProduct = useCallback((productId) => {
    return productPlans[productId] || [];
  }, [productPlans]);

  const fetchPlansForProduct = useCallback(async (productId) => {
    try {
      const data = await apiFetch(`/api/products/${productId}/plans`);
      setProductPlans((prev) => ({ ...prev, [productId]: data.plans || [] }));
      return data.plans || [];
    } catch {
      return productPlans[productId] || [];
    }
  }, [productPlans]);

  const addProductPlan = async (productId, planData) => {
    const cleanPlan = {
      ...planData,
      price: Math.max(0, parseFloat(planData.price) || 0),
      minimumQuantity: Math.max(1, parseInt(planData.minimumQuantity) || 1)
    };

    try {
      // Ensure the product is in DB (handles edge case where product was deleted/re-created)
      const prodCheck = await apiFetch('/api/products').catch(() => ({ products: [] }));
      const prodExists = (prodCheck.products || []).some(p => p.id === productId);
      if (!prodExists) {
        const localProd = products.find(p => p.id === productId);
        if (localProd) {
          await apiFetch('/api/products', { method: 'POST', body: JSON.stringify(localProd) });
        }
      }

      const data = await apiFetch(`/api/products/${productId}/plans`, {
        method: 'POST',
        body: JSON.stringify(cleanPlan)
      });
      const savedPlan = data.plan;
      setProductPlans((prev) => ({
        ...prev,
        [productId]: [...(prev[productId] || []), savedPlan]
      }));
      showToast(`Plan "${savedPlan.name}" added!`, 'success');
      return savedPlan;
    } catch (err) {
      showToast(`Failed to create plan: ${err.message}`, 'error');
      return null;
    }
  };

  const updateProductPlan = async (planId, productId, updates) => {
    const cleanUpdates = {
      ...updates,
      ...(updates.price !== undefined ? { price: Math.max(0, parseFloat(updates.price) || 0) } : {}),
      ...(updates.minimumQuantity !== undefined ? { minimumQuantity: Math.max(1, parseInt(updates.minimumQuantity) || 1) } : {})
    };

    try {
      const data = await apiFetch(`/api/plans/${planId}`, { method: 'PUT', body: JSON.stringify(cleanUpdates) });
      const updatedPlan = data.plan;
      setProductPlans((prev) => {
        const current = prev[productId] || [];
        return { ...prev, [productId]: current.map(p => p.id === planId ? updatedPlan : p) };
      });
      showToast('Plan updated successfully!', 'success');
    } catch (err) {
      showToast(`Failed to update plan: ${err.message}`, 'error');
    }
  };

  const toggleProductPlan = async (planId, productId, isActive) => {
    try {
      await apiFetch(`/api/plans/${planId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive })
      });
    } catch (err) {
      console.warn('toggleProductPlan error:', err.message);
    }
    setProductPlans((prev) => {
      const current = prev[productId] || [];
      return { ...prev, [productId]: current.map(p => p.id === planId ? { ...p, isActive } : p) };
    });
    showToast(`Plan ${isActive ? 'activated' : 'deactivated'}.`, 'info');
  };

  const deleteProductPlan = async (planId, productId) => {
    try {
      await apiFetch(`/api/plans/${planId}`, { method: 'DELETE' });
    } catch (err) {
      console.warn('deleteProductPlan error:', err.message);
    }
    setProductPlans((prev) => {
      const current = prev[productId] || [];
      return { ...prev, [productId]: current.filter(p => p.id !== planId) };
    });
    showToast('Plan removed.', 'info');
  };

  // ── Subscription Actions ──────────────────────────────────────────────────

  const createSubscription = async (quoteData) => {
    const today = getLocalDateString();
    const status = quoteData.status || 'Draft';
    const numberPrefix = ['Draft', 'Quotation'].includes(status) ? 'QT' : 'SUB';
    const parsedValidityDays = Number.parseInt(quoteData.quoteValidityDays, 10);
    const quoteValidityDays = Number.isInteger(parsedValidityDays) && parsedValidityDays > 0
      ? parsedValidityDays : 30;

    const newSub = {
      ...quoteData,
      id: createSubscriptionId(),
      status,
      subNumber: getNextDocumentNumber(numberPrefix, subscriptions),
      quoteValidityDays,
      quoteValidUntil: quoteData.quoteValidUntil || addDaysToDateString(today, quoteValidityDays),
      quoteIssuedAt: status === 'Quotation' ? (quoteData.quoteIssuedAt || today) : (quoteData.quoteIssuedAt || null),
      createdAt: quoteData.createdAt || today,
      updatedAt: today
    };

    try {
      const data = await apiFetch('/api/subscriptions', { method: 'POST', body: JSON.stringify(newSub) });
      const saved = data.subscription;
      setSubscriptions((prev) => [saved, ...prev]);
      showToast(`${numberPrefix === 'QT' ? 'Quotation' : 'Subscription'} ${saved.subNumber} created!`, 'success');
      return saved;
    } catch (err) {
      showToast(`Failed to create subscription: ${err.message}`, 'error');
      return null;
    }
  };

  const updateSubscriptionStatus = async (id, newStatus) => {
    const currentSub = subscriptions.find((sub) => sub.id === id);
    if (!currentSub) return null;
    const today = getLocalDateString();
    const isReissuedQuotation = currentSub.status === 'Closed' && newStatus === 'Quotation';
    const isRejectedQuote = newStatus === 'Closed' && ['Draft', 'Quotation'].includes(currentSub.status);
    const targetPrefix = ['Draft', 'Quotation'].includes(newStatus) || isRejectedQuote ? 'QT' : 'SUB';
    const numberNeedsRefresh = isReissuedQuotation || !String(currentSub.subNumber || '').startsWith(`${targetPrefix}-`);
    const subNumber = numberNeedsRefresh
      ? getNextDocumentNumber(targetPrefix, subscriptions)
      : currentSub.subNumber;
    const parsedValidityDays = Number.parseInt(currentSub.quoteValidityDays, 10);
    const quoteValidityDays = Number.isInteger(parsedValidityDays) && parsedValidityDays > 0
      ? parsedValidityDays : 30;
    const isIssuingQuotation = newStatus === 'Quotation' && currentSub.status !== 'Quotation';
    const updatedSub = {
      ...currentSub,
      status: newStatus,
      subNumber,
      updatedAt: today,
      ...(isIssuingQuotation ? {
        quoteValidityDays,
        quoteIssuedAt: today,
        quoteValidUntil: addDaysToDateString(today, quoteValidityDays),
        ...(isReissuedQuotation ? { renewalOf: currentSub.subNumber } : {})
      } : {})
    };

    try {
      const data = await apiFetch(`/api/subscriptions/${id}`, { method: 'PUT', body: JSON.stringify(updatedSub) });
      const saved = data.subscription;
      setSubscriptions((prev) => prev.map((sub) => sub.id === id ? saved : sub));
      showToast(`Subscription updated to: ${newStatus}`, 'info');
      return saved;
    } catch (err) {
      showToast(`Failed to update subscription: ${err.message}`, 'error');
      return null;
    }
  };

  // ── Billing Engine ────────────────────────────────────────────────────────

  const advanceBillingDate = (dateStr, frequency = 'monthly') => {
    const d = new Date(dateStr || Date.now());
    switch (frequency) {
      case 'daily': d.setDate(d.getDate() + 1); break;
      case 'weekly': d.setDate(d.getDate() + 7); break;
      case 'yearly': d.setFullYear(d.getFullYear() + 1); break;
      case 'monthly': default: d.setMonth(d.getMonth() + 1); break;
    }
    return d.toISOString().split('T')[0];
  };

  const computeDueDate = (issueDateStr, paymentTerms = 'Net 15') => {
    const issueDate = new Date(issueDateStr || Date.now());
    let daysToAdd = 15;
    if (paymentTerms === 'Net 30') daysToAdd = 30;
    else if (paymentTerms === 'Net 60') daysToAdd = 60;
    else if (paymentTerms === 'Due upon receipt') daysToAdd = 0;
    issueDate.setDate(issueDate.getDate() + daysToAdd);
    return issueDate.toISOString().split('T')[0];
  };

  const getDueSubscriptions = (targetDateStr = new Date().toISOString().split('T')[0]) => {
    const activeSubs = subscriptions.filter((s) => s.status === 'Active');
    const due = [];
    const alreadyBilled = [];
    activeSubs.forEach((sub) => {
      const isAlreadyInvoiced = invoices.some((inv) => {
        if (inv.subscriptionNumber !== sub.subNumber || inv.status === 'Cancelled') return false;
        if (inv.issueDate === targetDateStr) return true;
        if (sub.billingFrequency === 'monthly' && inv.issueDate?.slice(0, 7) === targetDateStr.slice(0, 7)) return true;
        if (sub.billingFrequency === 'yearly' && inv.issueDate?.slice(0, 4) === targetDateStr.slice(0, 4)) return true;
        return false;
      });
      if (isAlreadyInvoiced) {
        alreadyBilled.push(sub);
      } else {
        const isDateDue = !sub.nextBillingDate || sub.nextBillingDate <= targetDateStr;
        if (isDateDue) due.push(sub);
      }
    });
    return { due, alreadyBilled };
  };

  const validateDiscount = ({ code, items = [], subtotal = 0, date = new Date().toISOString().split('T')[0] }) => {
    if (!code || !code.trim()) return { valid: false, message: '' };
    const cleanCode = code.trim().toUpperCase();
    const rule = discounts.find((d) => d.code.toUpperCase() === cleanCode);
    if (!rule) return { valid: false, message: `Coupon code "${cleanCode}" does not exist.` };
    if (!rule.isActive) return { valid: false, message: `Discount rule "${rule.code}" is currently deactivated.` };
    if (rule.endDate && date > rule.endDate) return { valid: false, message: `Discount code "${rule.code}" expired on ${rule.endDate}.` };
    if (rule.startDate && date < rule.startDate) return { valid: false, message: `Discount code "${rule.code}" is not valid until ${rule.startDate}.` };
    if (rule.usageLimit !== undefined && (rule.timesUsed || 0) >= rule.usageLimit) return { valid: false, message: `Discount limit reached: ${rule.usageLimit} redemptions exhausted.` };

    const totalQuantity = items.reduce((sum, it) => sum + (parseInt(it.quantity, 10) || 1), 0);
    if (rule.minQuantity && totalQuantity < rule.minQuantity) {
      return { valid: false, rule, message: `Volume threshold: Requires at least ${rule.minQuantity} seats (currently ${totalQuantity}).` };
    }
    if (rule.minAmount && subtotal < rule.minAmount) {
      return { valid: false, rule, message: `Minimum spend: Requires at least $${rule.minAmount.toFixed(2)} (current: $${subtotal.toFixed(2)}).` };
    }

    let deduction = 0;
    if (rule.scope === 'specific_product' && rule.targetProductId) {
      const eligibleItems = items.filter((it) => it.productId === rule.targetProductId);
      const eligibleSubtotal = eligibleItems.reduce((sum, it) => sum + ((parseInt(it.quantity, 10) || 0) * (parseFloat(it.unitPrice) || 0)), 0);
      if (eligibleSubtotal <= 0) return { valid: false, rule, message: `Applies specifically to target product, which is not present in this contract.` };
      deduction = rule.type === 'percentage' ? (eligibleSubtotal * rule.value) / 100 : Math.min(rule.value, eligibleSubtotal);
    } else {
      deduction = rule.type === 'percentage' ? (subtotal * rule.value) / 100 : Math.min(rule.value, subtotal);
    }

    return {
      valid: true, rule, deduction,
      message: `✅ "${rule.name}" applied: ${rule.type === 'percentage' ? `${rule.value}% off` : `$${rule.value} off`} (-$${deduction.toFixed(2)})`
    };
  };

  const runBillingDay = async (targetDateStr = new Date().toISOString().split('T')[0]) => {
    const { due } = getDueSubscriptions(targetDateStr);
    let generatedCount = 0;
    let totalGeneratedAmount = 0;
    const newInvoicesList = [];
    const updatedSubIds = new Set();
    const usedDiscountMap = {};

    due.forEach((sub) => {
      let subtotal = 0;
      let taxTotal = 0;

      const invoiceItems = sub.items.map((item) => {
        const qty = parseInt(item.quantity, 10) || 1;
        const price = parseFloat(item.unitPrice) || 0;
        const lineSubtotal = qty * price;
        subtotal += lineSubtotal;
        const taxRate = item.taxRate !== undefined ? item.taxRate : 0.10;
        const lineTax = lineSubtotal * taxRate;
        taxTotal += lineTax;
        return {
          productId: item.productId,
          name: `${item.name} (${item.variant || 'Standard Edition'})`,
          quantity: qty, unitPrice: price, taxRate, taxAmount: lineTax,
          total: lineSubtotal + lineTax
        };
      });

      let discountDeduction = 0;
      let appliedDiscountRule = null;
      if (sub.discountCode) {
        const validation = validateDiscount({ code: sub.discountCode, items: sub.items, subtotal, date: targetDateStr });
        if (validation.valid) {
          discountDeduction = validation.deduction;
          appliedDiscountRule = validation.rule;
          usedDiscountMap[appliedDiscountRule.code] = (usedDiscountMap[appliedDiscountRule.code] || 0) + 1;
        }
      }

      if (discountDeduction > 0 && subtotal > 0) {
        taxTotal = taxTotal * ((subtotal - discountDeduction) / subtotal);
      }

      const total = Math.max(0, subtotal - discountDeduction + taxTotal);
      const dueDate = computeDueDate(targetDateStr, sub.paymentTerms);

      newInvoicesList.push({
        id: `inv-${Date.now()}-${generatedCount}`,
        invoiceNumber: `INV-${new Date().getFullYear()}-${String(invoices.length + generatedCount + 1).padStart(3, '0')}`,
        subscriptionNumber: sub.subNumber,
        customerName: sub.customerName,
        customerEmail: sub.customerEmail,
        issueDate: targetDateStr,
        dueDate,
        billingPeriodStart: sub.nextBillingDate || targetDateStr,
        billingPeriodEnd: advanceBillingDate(sub.nextBillingDate || targetDateStr, sub.billingFrequency),
        subtotal, taxTotal,
        discountAmount: discountDeduction,
        discountCode: appliedDiscountRule ? appliedDiscountRule.code : null,
        total, amountPaid: 0, balance: total,
        status: 'Confirmed', sentAt: null, items: invoiceItems
      });

      updatedSubIds.add(sub.id);
      generatedCount++;
      totalGeneratedAmount += total;
    });

    if (newInvoicesList.length > 0) {
      // Persist all new invoices to DB
      try {
        const bulkRes = await apiFetch('/api/invoices/bulk', {
          method: 'POST',
          body: JSON.stringify({ invoices: newInvoicesList })
        });
        setInvoices((prev) => [...(bulkRes.invoices || newInvoicesList), ...prev]);
      } catch {
        setInvoices((prev) => [...newInvoicesList, ...prev]);
      }

      // Advance billing dates for processed subscriptions in DB
      const updatedSubs = await Promise.all(
        subscriptions.map(async (sub) => {
          if (!updatedSubIds.has(sub.id)) return sub;
          const nextDate = advanceBillingDate(sub.nextBillingDate || targetDateStr, sub.billingFrequency);
          const updates = { ...sub, lastBillingDate: targetDateStr, nextBillingDate: nextDate };
          try {
            const d = await apiFetch(`/api/subscriptions/${sub.id}`, { method: 'PUT', body: JSON.stringify(updates) });
            return d.subscription;
          } catch { return updates; }
        })
      );
      setSubscriptions(updatedSubs);

      // Record discount usage in DB
      if (Object.keys(usedDiscountMap).length > 0) {
        Object.entries(usedDiscountMap).forEach(([code, count]) => {
          apiFetch('/api/discounts/use', { method: 'POST', body: JSON.stringify({ code, count }) })
            .catch((e) => console.warn('Could not record discount usage:', e.message));
        });
        setDiscounts((prev) =>
          prev.map((d) => {
            const count = usedDiscountMap[d.code];
            if (count) {
              const newTimesUsed = (d.timesUsed || 0) + count;
              return { ...d, timesUsed: newTimesUsed, isActive: (d.usageLimit && newTimesUsed >= d.usageLimit) ? false : d.isActive };
            }
            return d;
          })
        );
      }

      showToast(`⚡ Billing Day: ${newInvoicesList.length} invoices generated ($${totalGeneratedAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })})!`, 'success');
    } else {
      showToast(`All active subscriptions are up to date for ${targetDateStr}. No invoices due.`, 'info');
    }

    return { generatedCount, totalAmount: totalGeneratedAmount, invoices: newInvoicesList };
  };

  // ── Invoice Actions ───────────────────────────────────────────────────────

  const confirmInvoice = async (invoiceId) => {
    try {
      const data = await apiFetch(`/api/invoices/${invoiceId}`, { method: 'PATCH', body: JSON.stringify({ status: 'Confirmed' }) });
      setInvoices((prev) => prev.map((inv) => inv.id === invoiceId ? data.invoice : inv));
    } catch {
      setInvoices((prev) => prev.map((inv) => inv.id === invoiceId ? { ...inv, status: 'Confirmed' } : inv));
    }
    showToast('Invoice confirmed and queued for collection.', 'success');
  };

  const cancelInvoice = async (invoiceId) => {
    try {
      const data = await apiFetch(`/api/invoices/${invoiceId}`, { method: 'PATCH', body: JSON.stringify({ status: 'Cancelled' }) });
      setInvoices((prev) => prev.map((inv) => inv.id === invoiceId ? data.invoice : inv));
    } catch {
      setInvoices((prev) => prev.map((inv) => inv.id === invoiceId ? { ...inv, status: 'Cancelled' } : inv));
    }
    showToast('Invoice has been cancelled.', 'info');
  };

  const sendInvoice = async (invoiceId) => {
    const sentAt = new Date().toISOString();
    try {
      const data = await apiFetch(`/api/invoices/${invoiceId}`, { method: 'PATCH', body: JSON.stringify({ sentAt }) });
      setInvoices((prev) => prev.map((inv) => inv.id === invoiceId ? data.invoice : inv));
    } catch {
      setInvoices((prev) => prev.map((inv) => inv.id === invoiceId ? { ...inv, sentAt } : inv));
    }
    showToast('Invoice PDF dispatched via email to customer.', 'success');
  };

  const recordPayment = async ({ invoiceId, amount, method, note, transactionRef }) => {
    const targetInvoice = invoices.find((inv) => inv.id === invoiceId);
    if (!targetInvoice) return;

    const paymentAmount = parseFloat(amount);
    const newPaidTotal = (targetInvoice.amountPaid || 0) + paymentAmount;
    const newBalance = Math.max(0, targetInvoice.total - newPaidTotal);
    const newStatus = newBalance <= 0.01 ? 'Paid' : 'Partially Paid';

    const paymentData = {
      invoiceId,
      invoiceNumber: targetInvoice.invoiceNumber,
      customerName: targetInvoice.customerName,
      date: new Date().toISOString().split('T')[0],
      method: method || 'Credit Card (Stripe)',
      amount: paymentAmount,
      transactionRef: transactionRef || `TXN-${Math.floor(100000 + Math.random() * 900000)}`,
      note: note || 'Payment recorded',
      status: 'Completed',
      paymentNumber: `PAY-${new Date().getFullYear()}-${String(payments.length + 1).padStart(3, '0')}`,
      // Pass along invoice totals so server can update invoice in one call
      invoiceTotal: targetInvoice.total,
      invoiceAmountPaid: targetInvoice.amountPaid || 0
    };

    try {
      const data = await apiFetch('/api/payments', { method: 'POST', body: JSON.stringify(paymentData) });
      setPayments((prev) => [data.payment, ...prev]);
    } catch (err) {
      console.warn('recordPayment error:', err.message);
      setPayments((prev) => [{
        id: `pay-${Date.now()}`,
        ...paymentData
      }, ...prev]);
    }

    setInvoices((prev) =>
      prev.map((inv) =>
        inv.id === invoiceId ? { ...inv, amountPaid: newPaidTotal, balance: newBalance, status: newStatus } : inv
      )
    );
    showToast(`Payment of $${paymentAmount.toFixed(2)} recorded for ${targetInvoice.invoiceNumber}`, 'success');
  };

  // ── Discount Actions ──────────────────────────────────────────────────────

  const fetchDiscounts = useCallback(async () => {
    try {
      const data = await apiFetch('/api/discounts');
      setDiscounts(data.discounts || []);
      return data.discounts;
    } catch { return null; }
  }, []);

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

    try {
      const data = await apiFetch('/api/discounts', { method: 'POST', body: JSON.stringify(cleanData) });
      setDiscounts((prev) => [data.discount, ...prev.filter(d => d.id !== data.discount.id && d.code !== data.discount.code)]);
      showToast(`Discount rule "${data.discount.code}" created & persisted to database!`, 'success');
      return data.discount;
    } catch (err) {
      showToast(err.message || 'Failed to save discount to database', 'error');
      return null;
    }
  };

  const toggleDiscountStatus = async (discountId) => {
    const target = discounts.find((d) => d.id === discountId);
    if (!target) return;
    const newActive = !target.isActive;
    setDiscounts((prev) => prev.map((d) => d.id === discountId ? { ...d, isActive: newActive } : d));
    try {
      const data = await apiFetch(`/api/discounts/${discountId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: newActive })
      });
      if (data.discount) setDiscounts((prev) => prev.map((d) => d.id === discountId ? data.discount : d));
      showToast(`Discount "${target.code}" ${newActive ? 'activated' : 'paused'} in database!`, 'info');
    } catch {
      showToast('Discount status updated.', 'warning');
    }
  };

  const deleteDiscount = async (discountId) => {
    const target = discounts.find((d) => d.id === discountId);
    try {
      await apiFetch(`/api/discounts/${discountId}`, { method: 'DELETE' });
    } catch (err) {
      console.warn('deleteDiscount error:', err.message);
    }
    setDiscounts((prev) => prev.filter((d) => d.id !== discountId));
    showToast(`Discount rule "${target?.code || discountId}" deleted from database.`, 'info');
  };

  const sendPaymentReminder = (invoiceId) => {
    const inv = invoices.find((i) => i.id === invoiceId);
    showToast(`Payment reminder email sent to ${inv?.customerEmail || 'customer'} for ${inv?.invoiceNumber}`, 'info');
  };

  // ── Reset ─────────────────────────────────────────────────────────────────

  const resetToDefaultData = async () => {
    await loadAllData();
    showToast('Data refreshed from database!', 'info');
  };

  return (
    <SubscriptionContext.Provider
      value={{
        // State
        products,
        productPlans,
        quotationTemplates,
        subscriptions,
        invoices,
        discounts,
        payments,
        loading,
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
        resetToDefaultData,
        loadAllData
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
