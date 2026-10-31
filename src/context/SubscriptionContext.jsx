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

  // Helper to normalize user/persona object so both full_name/name and company_name/company work seamlessly
  const normalizeUserData = (user) => {
    if (!user) return defaultPersonas[0];
    return {
      ...user,
      name: user.full_name || user.name || user.email || 'User',
      company: user.company_name || user.company || 'Brightloop Systems',
      role: user.role || 'staff'
    };
  };

  // Current active persona / logged in user
  const [currentPersona, setCurrentPersona] = useState(() => {
    if (initialUser) return normalizeUserData(initialUser);
    return defaultPersonas[0]; // Admin by default
  });

  // Keep currentPersona synchronized when initialUser changes
  useEffect(() => {
    if (initialUser) {
      setCurrentPersona(normalizeUserData(initialUser));
    }
  }, [initialUser]);

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
  // Helper to advance date by billing interval
  const advanceBillingDate = (dateStr, frequency) => {
    const d = new Date(dateStr || new Date());
    if (isNaN(d.getTime())) return new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];
    switch (frequency?.toLowerCase()) {
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

  // Helper to calculate due date from payment terms
  const computeDueDate = (issueDateStr, terms) => {
    const d = new Date(issueDateStr);
    if (terms?.includes('15')) d.setDate(d.getDate() + 15);
    else if (terms?.includes('30')) d.setDate(d.getDate() + 30);
    else if (terms?.includes('60')) d.setDate(d.getDate() + 60);
    else if (terms?.toLowerCase().includes('immediate') || terms?.toLowerCase().includes('receipt')) d.setDate(d.getDate() + 1);
    else d.setDate(d.getDate() + 15);
    return d.toISOString().split('T')[0];
  };

  // Inspection helper: returns subscriptions that are due vs already billed
  const getDueSubscriptions = (targetDateStr = new Date().toISOString().split('T')[0]) => {
    const activeSubs = subscriptions.filter((s) => s.status === 'Active');
    const due = [];
    const alreadyBilled = [];

    activeSubs.forEach((sub) => {
      // Check if an invoice was already generated for this cycle
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
        // Due if nextBillingDate is on or before target date, or if no date is set
        const isDateDue = !sub.nextBillingDate || sub.nextBillingDate <= targetDateStr;
        if (isDateDue) {
          due.push(sub);
        }
      }
    });

    return { due, alreadyBilled };
  };

  // Billing Day Engine: Scene 4 in Problem Statement
  // Automatically generates invoices for active subscriptions and prevents double billing
  const runBillingDay = (targetDateStr = new Date().toISOString().split('T')[0]) => {
    const { due } = getDueSubscriptions(targetDateStr);
    let generatedCount = 0;
    let totalGeneratedAmount = 0;
    const newInvoicesList = [];
    const updatedSubIds = new Set();

    due.forEach((sub) => {
      // Calculate subtotal from items
      let subtotal = 0;
      let taxTotal = 0;

      const invoiceItems = sub.items.map((item) => {
        const lineSubtotal = item.quantity * item.unitPrice;
        subtotal += lineSubtotal;
        const taxRate = item.taxRate !== undefined ? item.taxRate : 0.10;
        const lineTax = lineSubtotal * taxRate;
        taxTotal += lineTax;
        return {
          productId: item.productId,
          name: `${item.name} (${item.variant || 'Standard Edition'})`,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          taxRate,
          taxAmount: lineTax,
          total: lineSubtotal + lineTax
        };
      });

      // Calculate discounts
      let discountDeduction = 0;
      if (sub.discountCode) {
        const discountRule = discounts.find((d) => d.code === sub.discountCode && d.isActive);
        if (discountRule) {
          if (discountRule.type === 'percentage') {
            discountDeduction = (subtotal * discountRule.value) / 100;
          } else {
            discountDeduction = Math.min(discountRule.value, subtotal);
          }
        }
      }

      // Proportional tax adjustment if discount applies
      if (discountDeduction > 0 && subtotal > 0) {
        const discountRatio = (subtotal - discountDeduction) / subtotal;
        taxTotal = taxTotal * discountRatio;
      }

      const total = Math.max(0, subtotal - discountDeduction + taxTotal);
      const dueDate = computeDueDate(targetDateStr, sub.paymentTerms);

      const newInvoice = {
        id: `inv-${Date.now()}-${generatedCount}`,
        invoiceNumber: `INV-2026-${String(invoices.length + generatedCount + 1).padStart(3, '0')}`,
        subscriptionNumber: sub.subNumber,
        customerName: sub.customerName,
        customerEmail: sub.customerEmail,
        issueDate: targetDateStr,
        dueDate,
        billingPeriodStart: sub.nextBillingDate || targetDateStr,
        billingPeriodEnd: advanceBillingDate(sub.nextBillingDate || targetDateStr, sub.billingFrequency),
        subtotal,
        taxTotal,
        discountAmount: discountDeduction,
        discountCode: sub.discountCode || null,
        total,
        amountPaid: 0,
        balance: total,
        status: 'Confirmed', // Scene 4: Moves from Draft to Confirmed to Paid
        sentAt: null,
        items: invoiceItems
      };

      newInvoicesList.push(newInvoice);
      updatedSubIds.add(sub.id);
      generatedCount++;
      totalGeneratedAmount += total;
    });

    if (newInvoicesList.length > 0) {
      // 1. Add generated invoices
      setInvoices((prev) => [...newInvoicesList, ...prev]);

      // 2. Advance nextBillingDate for billed subscriptions
      setSubscriptions((prev) =>
        prev.map((sub) => {
          if (updatedSubIds.has(sub.id)) {
            const nextDate = advanceBillingDate(sub.nextBillingDate || targetDateStr, sub.billingFrequency);
            return {
              ...sub,
              lastBillingDate: targetDateStr,
              nextBillingDate: nextDate
            };
          }
          return sub;
        })
      );

      showToast(
        `⚡ Billing Day Run: ${newInvoicesList.length} invoices generated ($${totalGeneratedAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })})! Next billing dates advanced.`,
        'success'
      );
    } else {
      showToast(
        `All active subscriptions are up to date for ${targetDateStr}. No subscriptions due (Double-billing prevented)!`,
        'info'
      );
    }

    return { generatedCount, totalAmount: totalGeneratedAmount, invoices: newInvoicesList };
  };

  // Invoice Confirmation: Draft -> Confirmed
  const confirmInvoice = (invoiceId) => {
    setInvoices((prev) =>
      prev.map((inv) => (inv.id === invoiceId ? { ...inv, status: 'Confirmed' } : inv))
    );
    showToast('Invoice confirmed and queued for collection.', 'success');
  };

  // Invoice Cancellation: Scene 4
  const cancelInvoice = (invoiceId) => {
    setInvoices((prev) =>
      prev.map((inv) => (inv.id === invoiceId ? { ...inv, status: 'Cancelled', balance: 0 } : inv))
    );
    showToast('Invoice cancelled. Balance zeroed.', 'info');
  };

  // Send Invoice to Customer: Scene 4
  const sendInvoice = (invoiceId) => {
    const target = invoices.find((inv) => inv.id === invoiceId);
    setInvoices((prev) =>
      prev.map((inv) => (inv.id === invoiceId ? { ...inv, sentAt: new Date().toISOString() } : inv))
    );
    showToast(`Invoice ${target ? target.invoiceNumber : ''} dispatched to customer inbox.`, 'success');
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
        getDueSubscriptions,
        confirmInvoice,
        cancelInvoice,
        sendInvoice,
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
