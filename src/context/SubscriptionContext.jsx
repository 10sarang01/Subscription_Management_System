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

  // Product Actions
  const addProduct = (newProduct) => {
    const productWithId = {
      ...newProduct,
      id: `prod-${Date.now()}`
    };
    setProducts((prev) => [productWithId, ...prev]);
    showToast(`Product "${newProduct.name}" added successfully!`, 'success');
  };

  // Plan Actions
  const addPlan = (newPlan) => {
    const planWithId = {
      ...newPlan,
      id: `plan-${Date.now()}`
    };
    setPlans((prev) => [planWithId, ...prev]);
    showToast(`Plan "${newPlan.name}" launched!`, 'success');
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

    setProducts(initialProducts);
    setPlans(initialPlans);
    setSubscriptions(initialSubscriptions);
    setInvoices(initialInvoices);
    setDiscounts(initialDiscounts);
    setPayments(initialPayments);

    showToast('Platform reset to default hackathon dataset!', 'info');
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
        addPlan,
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
