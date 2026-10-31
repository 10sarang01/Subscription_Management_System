import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  initialProducts,
  initialQuotationTemplates,
  initialSubscriptions,
  initialInvoices,
  initialDiscounts,
  initialPayments,
  defaultPersonas
} from '../data/mockData';

const SubscriptionContext = createContext();

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

  const [quotationTemplates, setQuotationTemplates] = useState(() => {
    const saved = localStorage.getItem('brightloop_templates');
    return saved ? JSON.parse(saved) : initialQuotationTemplates;
  });

  const [subscriptions, setSubscriptions] = useState(() => {
    const saved = localStorage.getItem('brightloop_subscriptions');
    return saved ? JSON.parse(saved) : initialSubscriptions;
  });

  const [invoices, setInvoices] = useState(() => {
    const saved = localStorage.getItem('brightloop_invoices');
    return saved ? JSON.parse(saved) : initialInvoices;
  });

  const [discounts, setDiscounts] = useState(() => {
    const saved = localStorage.getItem('brightloop_discounts');
    return saved ? JSON.parse(saved) : initialDiscounts;
  });

  const [payments, setPayments] = useState(() => {
    const saved = localStorage.getItem('brightloop_payments');
    return saved ? JSON.parse(saved) : initialPayments;
  });

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

  // ── localStorage sync ─────────────────────────────────────────────────
  useEffect(() => {
    localStorage.setItem('brightloop_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('brightloop_product_plans', JSON.stringify(productPlans));
  }, [productPlans]);

  useEffect(() => {
    localStorage.setItem('brightloop_subscriptions', JSON.stringify(subscriptions));
  }, [subscriptions]);

  useEffect(() => {
    localStorage.setItem('brightloop_invoices', JSON.stringify(invoices));
  }, [invoices]);

  useEffect(() => {
    localStorage.setItem('brightloop_discounts', JSON.stringify(discounts));
  }, [discounts]);

  useEffect(() => {
    localStorage.setItem('brightloop_payments', JSON.stringify(payments));
  }, [payments]);

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

  // ── Subscription Actions ──────────────────────────────────────────────

  const createSubscription = (quoteData) => {
    const subNumber = quoteData.status === 'Draft'
      ? `QT-2026-${Math.floor(100 + Math.random() * 900)}`
      : `SUB-2026-${Math.floor(100 + Math.random() * 900)}`;

    const newSub = {
      ...quoteData,
      id: `sub-${Date.now()}`,
      subNumber,
      createdAt: new Date().toISOString().split('T')[0]
    };

    setSubscriptions((prev) => [newSub, ...prev]);
    showToast(`Subscription ${subNumber} created in ${quoteData.status} status!`, 'success');
    return newSub;
  };

  const updateSubscriptionStatus = (id, newStatus) => {
    setSubscriptions((prev) =>
      prev.map((sub) => {
        if (sub.id === id) {
          let subNumber = sub.subNumber;
          if (subNumber.startsWith('QT-') && (newStatus === 'Confirmed' || newStatus === 'Active')) {
            subNumber = `SUB-2026-${Math.floor(100 + Math.random() * 900)}`;
          }
          return { ...sub, status: newStatus, subNumber };
        }
        return sub;
      })
    );
    showToast(`Subscription updated to status: ${newStatus}`, 'info');
  };

  // ── Billing Day Engine ────────────────────────────────────────────────

  const runBillingDay = () => {
    const activeSubs = subscriptions.filter((s) => s.status === 'Active');
    let generatedCount = 0;
    const newInvoicesList = [];

    activeSubs.forEach((sub) => {
      const alreadyInvoiced = invoices.some(
        (inv) => inv.subscriptionNumber === sub.subNumber &&
          inv.status !== 'Cancelled' &&
          inv.issueDate === new Date().toISOString().split('T')[0]
      );

      if (!alreadyInvoiced) {
        const subtotal = sub.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

        let discountDeduction = 0;
        if (sub.discountCode) {
          const discountRule = discounts.find(d => d.code === sub.discountCode && d.isActive);
          if (discountRule) {
            if (discountRule.type === 'percentage') {
              discountDeduction = (subtotal * discountRule.value) / 100;
            } else {
              discountDeduction = Math.min(discountRule.value, subtotal);
            }
          }
        }

        const taxTotal = (subtotal - discountDeduction) * 0.10;
        const total = (subtotal - discountDeduction) + taxTotal;

        const newInvoice = {
          id: `inv-${Date.now()}-${generatedCount}`,
          invoiceNumber: `INV-2026-${String(invoices.length + generatedCount + 1).padStart(3, '0')}`,
          subscriptionNumber: sub.subNumber,
          customerName: sub.customerName,
          customerEmail: sub.customerEmail,
          issueDate: new Date().toISOString().split('T')[0],
          dueDate: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
          subtotal,
          taxTotal,
          discountAmount: discountDeduction,
          total,
          amountPaid: 0,
          balance: total,
          status: 'Confirmed',
          items: sub.items.map(i => ({
            name: `${i.name} (${i.variant || 'Standard'})`,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            total: i.quantity * i.unitPrice
          }))
        };

        newInvoicesList.push(newInvoice);
        generatedCount++;
      }
    });

    if (newInvoicesList.length > 0) {
      setInvoices((prev) => [...newInvoicesList, ...prev]);
      showToast(`⚡ Billing Day Batch: ${newInvoicesList.length} invoices generated!`, 'success');
    } else {
      showToast('All active subscriptions have already been billed for this cycle.', 'info');
    }

    return generatedCount;
  };

  // ── Invoice & Payment Actions ─────────────────────────────────────────

  const confirmInvoice = (invoiceId) => {
    setInvoices((prev) =>
      prev.map((inv) => (inv.id === invoiceId ? { ...inv, status: 'Confirmed' } : inv))
    );
    showToast('Invoice confirmed and dispatched to customer.', 'success');
  };

  const recordPayment = ({ invoiceId, amount, method, note, transactionRef }) => {
    const targetInvoice = invoices.find((inv) => inv.id === invoiceId);
    if (!targetInvoice) return;

    const paymentAmount = parseFloat(amount);
    const newPaidTotal = (targetInvoice.amountPaid || 0) + paymentAmount;
    const newBalance = Math.max(0, targetInvoice.total - newPaidTotal);
    const newStatus = newBalance <= 0.01 ? 'Paid' : 'Partially Paid';

    setInvoices((prev) =>
      prev.map((inv) =>
        inv.id === invoiceId
          ? { ...inv, amountPaid: newPaidTotal, balance: newBalance, status: newStatus }
          : inv
      )
    );

    const newPayment = {
      id: `pay-${Date.now()}`,
      paymentNumber: `PAY-2026-${String(payments.length + 1).padStart(3, '0')}`,
      invoiceNumber: targetInvoice.invoiceNumber,
      customerName: targetInvoice.customerName,
      date: new Date().toISOString().split('T')[0],
      method: method || 'Credit Card (Stripe)',
      amount: paymentAmount,
      transactionRef: transactionRef || `TXN-${Math.floor(100000 + Math.random() * 900000)}`,
      note: note || 'Payment recorded',
      status: 'Completed'
    };

    setPayments((prev) => [newPayment, ...prev]);
    showToast(`Payment of $${paymentAmount.toFixed(2)} recorded for ${targetInvoice.invoiceNumber}`, 'success');
  };

  // ── Discount Actions ──────────────────────────────────────────────────

  const createDiscount = (discountData) => {
    const newDiscount = {
      ...discountData,
      id: `disc-${Date.now()}`,
      timesUsed: 0,
      isActive: true
    };
    setDiscounts((prev) => [newDiscount, ...prev]);
    showToast(`Discount rule "${newDiscount.code}" created!`, 'success');
  };

  const sendPaymentReminder = (invoiceId) => {
    const inv = invoices.find((i) => i.id === invoiceId);
    showToast(`Payment reminder email sent to ${inv?.customerEmail || 'customer'} for ${inv?.invoiceNumber}`, 'info');
  };

  // ── Reset ─────────────────────────────────────────────────────────────

  const resetToDefaultData = () => {
    localStorage.removeItem('brightloop_products');
    localStorage.removeItem('brightloop_product_plans');
    localStorage.removeItem('brightloop_subscriptions');
    localStorage.removeItem('brightloop_invoices');
    localStorage.removeItem('brightloop_discounts');
    localStorage.removeItem('brightloop_payments');

    setProducts([]);
    setProductPlans({});
    setSubscriptions(initialSubscriptions);
    setInvoices(initialInvoices);
    setDiscounts(initialDiscounts);
    setPayments(initialPayments);

    showToast('Platform reset to clean live state!', 'info');
  };

  return (
    <SubscriptionContext.Provider
      value={{
        // Data
        products,
        productPlans,
        quotationTemplates,
        subscriptions,
        invoices,
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
        runBillingDay,
        // Invoice actions
        confirmInvoice,
        recordPayment,
        // Discount actions
        createDiscount,
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
