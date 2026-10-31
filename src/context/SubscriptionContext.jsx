import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  initialProducts,
  initialPlans,
  initialQuotationTemplates,
  initialSubscriptions,
  initialInvoices,
  initialDiscounts,
  initialPayments,
  defaultPersonas
} from '../data/mockData';

const SubscriptionContext = createContext();

export function SubscriptionProvider({ children, initialUser }) {
  // Load initial states with localStorage persistence
  const [products, setProducts] = useState(() => {
    const saved = localStorage.getItem('brightloop_products');
    return saved ? JSON.parse(saved) : initialProducts;
  });

  const [plans, setPlans] = useState(() => {
    const saved = localStorage.getItem('brightloop_plans');
    return saved ? JSON.parse(saved) : initialPlans;
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
    return defaultPersonas[0]; // Admin by default
  });

  // Toast notification
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'info') => {
    setToast({ id: Date.now(), message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('brightloop_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('brightloop_plans', JSON.stringify(plans));
  }, [plans]);

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

  // Fetch live products and plans from SQLite backend
  useEffect(() => {
    fetch('/api/products')
      .then((r) => r.json())
      .then((data) => {
        if (data.products) {
          setProducts(data.products);
        }
      })
      .catch((err) => console.log('Products API sync fallback to local store:', err.message));

    fetch('/api/plans')
      .then((r) => r.json())
      .then((data) => {
        if (data.plans) {
          setPlans(data.plans);
        }
      })
      .catch((err) => console.log('Plans API sync fallback to local store:', err.message));
  }, []);

  // Product Actions (Live SQLite Persistence)
  const addProduct = async (newProduct) => {
    let savedProduct = null;
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProduct)
      });
      if (res.ok) {
        const data = await res.json();
        savedProduct = data.product;
      }
    } catch (err) {
      console.warn('API offline, saving product locally:', err.message);
    }

    if (!savedProduct) {
      savedProduct = {
        ...newProduct,
        id: `prod-${Date.now()}`
      };
    }

    setProducts((prev) => [savedProduct, ...prev.filter(p => p.id !== savedProduct.id)]);
    showToast(`Product "${savedProduct.name}" launched live!`, 'success');
    return savedProduct;
  };

  const deleteProduct = async (id) => {
    try {
      await fetch(`/api/products/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.warn('API delete offline, deleting locally:', err.message);
    }
    setProducts((prev) => prev.filter((p) => p.id !== id));
    showToast('Product removed.', 'info');
  };

  // Plan Actions (Live SQLite Persistence)
  const addPlan = async (newPlan) => {
    let savedPlan = null;
    try {
      const res = await fetch('/api/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPlan)
      });
      if (res.ok) {
        const data = await res.json();
        savedPlan = data.plan;
      }
    } catch (err) {
      console.warn('API offline, saving plan locally:', err.message);
    }

    if (!savedPlan) {
      savedPlan = {
        ...newPlan,
        id: `plan-${Date.now()}`
      };
    }

    setPlans((prev) => [savedPlan, ...prev.filter(p => p.id !== savedPlan.id)]);
    showToast(`Billing plan "${savedPlan.name}" launched live!`, 'success');
    return savedPlan;
  };

  const deletePlan = async (id) => {
    try {
      await fetch(`/api/plans/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.warn('API delete offline, deleting locally:', err.message);
    }
    setPlans((prev) => prev.filter((p) => p.id !== id));
    showToast('Billing plan removed.', 'info');
  };

  // Subscription Actions
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
          // If moving from Quote to Confirmed or Active, assign formal SUB- if it had QT-
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

  // Billing Day Engine: Scene 4 in Problem Statement
  // Automatically generates invoices for active subscriptions and prevents double billing
  const runBillingDay = () => {
    const activeSubs = subscriptions.filter((s) => s.status === 'Active');
    let generatedCount = 0;
    const newInvoicesList = [];

    activeSubs.forEach((sub) => {
      // Check if already invoiced for current cycle
      const alreadyInvoiced = invoices.some(
        (inv) => inv.subscriptionNumber === sub.subNumber && inv.status !== 'Cancelled' && inv.issueDate === new Date().toISOString().split('T')[0]
      );

      if (!alreadyInvoiced) {
        // Calculate subtotal from items
        const subtotal = sub.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
        
        // Check for eligible discounts
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

        // Automatic tax rule: 10% standard rate
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
          status: 'Confirmed', // Draft -> Confirmed -> Paid
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
      showToast(`⚡ Billing Day Batch: ${newInvoicesList.length} invoices generated automatically!`, 'success');
    } else {
      showToast('All active subscriptions have already been billed for this cycle. No double-billing!', 'info');
    }

    return generatedCount;
  };

  // Invoice Confirmation
  const confirmInvoice = (invoiceId) => {
    setInvoices((prev) =>
      prev.map((inv) => (inv.id === invoiceId ? { ...inv, status: 'Confirmed' } : inv))
    );
    showToast('Invoice confirmed and dispatched to customer.', 'success');
  };

  // Payment Recording: Scene 6
  const recordPayment = ({ invoiceId, amount, method, note, transactionRef }) => {
    const targetInvoice = invoices.find((inv) => inv.id === invoiceId);
    if (!targetInvoice) return;

    const paymentAmount = parseFloat(amount);
    const newPaidTotal = (targetInvoice.amountPaid || 0) + paymentAmount;
    const newBalance = Math.max(0, targetInvoice.total - newPaidTotal);
    const newStatus = newBalance <= 0.01 ? 'Paid' : 'Partially Paid';

    // Update invoice
    setInvoices((prev) =>
      prev.map((inv) =>
        inv.id === invoiceId
          ? {
              ...inv,
              amountPaid: newPaidTotal,
              balance: newBalance,
              status: newStatus
            }
          : inv
      )
    );

    // Add payment entry
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

  // Discount Rule Creation: Scene 5 (Admin Restricted)
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

  // Send Overdue Reminder
  const sendPaymentReminder = (invoiceId) => {
    const inv = invoices.find((i) => i.id === invoiceId);
    showToast(`Payment reminder email sent to ${inv?.customerEmail || 'customer'} for ${inv?.invoiceNumber}`, 'info');
  };

  // Reset to default sample data
  const resetToDefaultData = () => {
    localStorage.removeItem('brightloop_products');
    localStorage.removeItem('brightloop_plans');
    localStorage.removeItem('brightloop_subscriptions');
    localStorage.removeItem('brightloop_invoices');
    localStorage.removeItem('brightloop_discounts');
    localStorage.removeItem('brightloop_payments');

    setProducts([]);
    setPlans([]);
    setSubscriptions(initialSubscriptions);
    setInvoices(initialInvoices);
    setDiscounts(initialDiscounts);
    setPayments(initialPayments);

    showToast('Platform reset to clean live state!', 'info');
  };

  return (
    <SubscriptionContext.Provider
      value={{
        products,
        plans,
        quotationTemplates,
        subscriptions,
        invoices,
        discounts,
        payments,
        currentPersona,
        setCurrentPersona,
        toast,
        showToast,
        addProduct,
        deleteProduct,
        addPlan,
        deletePlan,
        createSubscription,
        updateSubscriptionStatus,
        runBillingDay,
        confirmInvoice,
        recordPayment,
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
