import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  Layers,
  LayoutDashboard,
  Package,
  FileText,
  CreditCard,
  Tag,
  DollarSign,
  Users,
  Shield,
  Zap,
  RotateCcw,
  LogOut,
  Bell,
  CheckCircle2,
  AlertCircle,
  Info,
  ExternalLink,
  Store
} from 'lucide-react';
import { useSubscription } from '../context/SubscriptionContext';
import { defaultPersonas } from '../data/mockData';

export default function Layout({ onLogout }) {
  const {
    currentPersona,
    setCurrentPersona,
    subscriptions,
    invoices,
    runBillingDay,
    resetToDefaultData,
    toast
  } = useSubscription();

  const location = useLocation();

  const activeSubsCount = subscriptions.filter((s) => s.status === 'Active').length;
  const overdueInvoicesCount = invoices.filter((i) => i.status === 'Overdue').length;

  const getPageInfo = () => {
    switch (location.pathname) {
      case '/':
      case '/dashboard':
        return {
          title: 'Executive & Finance Dashboard',
          subtitle: 'Scene 7: Real-time MRR, ARR, active subscriptions, receivables & overdue aging'
        };
      case '/products':
        return {
          title: 'Products, Variants & Plans Catalog',
          subtitle: 'Scene 2: Configure recurring software plans, variant pricing & lifecycle rules'
        };
      case '/quotes':
        return {
          title: 'Quotations & Subscriptions Lifecycle',
          subtitle: 'Scene 3: Templates, quote progression (Draft ➔ Quotation ➔ Confirmed ➔ Active ➔ Closed)'
        };
      case '/billing':
        return {
          title: 'Recurring Invoicing & Billing Day Engine',
          subtitle: 'Scene 4: Automated invoice generation, tax calculation rules & double-billing prevention'
        };
      case '/discounts':
        return {
          title: 'Discount Rules & Coupons Engine',
          subtitle: 'Scene 5: Admin-restricted discounts, percentage/fixed amounts & usage tracking'
        };
      case '/payments':
        return {
          title: 'Payments & Collections Ledger',
          subtitle: 'Scene 6: Multi-method transaction reconciliation & overdue invoice recovery'
        };
      case '/portal':
        return {
          title: 'Customer Self-Service Portal',
          subtitle: 'Scene 1: Customer view for managing subscriptions, add-ons & instant invoice payments'
        };
      case '/team':
        return {
          title: 'User Access & Staff Administration',
          subtitle: 'Scene 1: Role-based permissions, SQLite database integration & admin staff onboarding'
        };
      default:
        return {
          title: 'Subscription Management System',
          subtitle: 'Brightloop Enterprise Cloud Suite'
        };
    }
  };

  const pageInfo = getPageInfo();

  return (
    <div className="app-shell">
      {/* Left Navigation Sidebar */}
      <aside className="app-sidebar">
        <div>
          {/* Logo Brand */}
          <div className="sidebar-logo">
            <div
              className="neu-flat-sm"
              style={{
                width: '42px',
                height: '42px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--primary)',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #e2e8f0, #cbd5e1)'
              }}
            >
              <Layers size={22} />
            </div>
            <div>
              <h2
                style={{
                  fontSize: '1.18rem',
                  fontWeight: 800,
                  letterSpacing: '-0.02em',
                  color: '#1e293b'
                }}
              >
                Brightloop <span style={{ color: 'var(--primary)' }}>Systems</span>
              </h2>
              <span
                style={{
                  fontSize: '0.72rem',
                  color: 'var(--text-muted)',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em'
                }}
              >
                Enterprise Edition
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="sidebar-nav">
            <NavLink
              to="/"
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <LayoutDashboard size={18} />
              <span>Overview & Finance</span>
            </NavLink>

            <NavLink
              to="/products"
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <Package size={18} />
              <span>Products & Plans</span>
            </NavLink>

            <NavLink
              to="/quotes"
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <FileText size={18} />
              <span>Subscriptions & Quotes</span>
              <span className="sidebar-badge">{activeSubsCount}</span>
            </NavLink>

            <NavLink
              to="/billing"
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <CreditCard size={18} />
              <span>Invoices & Billing</span>
              {overdueInvoicesCount > 0 && (
                <span
                  className="sidebar-badge"
                  style={{ background: '#fee2e2', color: '#b91c1c' }}
                >
                  {overdueInvoicesCount} due
                </span>
              )}
            </NavLink>

            <NavLink
              to="/discounts"
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <Tag size={18} />
              <span>Discounts & Rules</span>
            </NavLink>

            <NavLink
              to="/payments"
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <DollarSign size={18} />
              <span>Payments & Aging</span>
            </NavLink>

            <div
              style={{
                height: '1px',
                background: 'rgba(184, 194, 204, 0.3)',
                margin: '10px 0'
              }}
            />

            <NavLink
              to="/portal"
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <Store size={18} />
              <span>Customer Portal</span>
            </NavLink>

            <NavLink
              to="/team"
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <Users size={18} />
              <span>Team & SQLite DB</span>
            </NavLink>
          </nav>
        </div>

        {/* Sidebar Footer: Persona Indicator & Quick Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', paddingTop: '16px', borderTop: '1px solid rgba(184, 194, 204, 0.3)' }}>
          {/* Signed-in User / Account Box */}
          <div className="neu-inset-sm" style={{ padding: '12px 14px' }}>
            <div
              style={{
                fontWeight: 800,
                fontSize: '0.92rem',
                color: 'var(--text-main)',
                letterSpacing: '-0.01em',
                lineHeight: 1.3
              }}
            >
              {currentPersona.company || currentPersona.company_name || 'Brightloop Systems'}
            </div>
            <div
              style={{
                fontSize: '0.78rem',
                color: 'var(--text-muted)',
                fontWeight: 500,
                marginTop: '3px',
                lineHeight: 1.2
              }}
            >
              {currentPersona.name || currentPersona.full_name || currentPersona.email}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={resetToDefaultData}
              className="neu-btn"
              title="Reset to default hackathon dataset"
              style={{ flex: 1, padding: '8px', fontSize: '0.75rem' }}
            >
              <RotateCcw size={13} />
              Reset Data
            </button>
            <button
              onClick={onLogout}
              className="neu-btn"
              title="Sign Out"
              style={{ padding: '8px 12px', fontSize: '0.75rem', color: 'var(--error)' }}
            >
              <LogOut size={13} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main View Area */}
      <div className="app-main">
        {/* Top Header Bar */}
        <header className="app-topbar">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
                {pageInfo.title}
              </h1>
              <span
                style={{
                  fontSize: '0.72rem',
                  padding: '3px 8px',
                  borderRadius: '999px',
                  background: '#dcfce7',
                  color: '#15803d',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#16a34a' }}></span>
                System Live
              </span>
            </div>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              {pageInfo.subtitle}
            </p>
          </div>

          {/* Right Header Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
            {/* Quick Billing Day Batch Automation Trigger */}
            <button
              onClick={() => runBillingDay()}
              className="neu-btn-primary"
              style={{ padding: '9px 16px', fontSize: '0.84rem' }}
              title="Simulate Scene 4: Automated recurring billing day run"
            >
              <Zap size={15} />
              ⚡ Run Billing Day
            </button>
          </div>
        </header>

        {/* Content Body */}
        <main className="app-content animate-fade-in">
          <Outlet />
        </main>
      </div>

      {/* Global Floating Toast */}
      {toast && (
        <div className={`toast-container toast-${toast.type}`}>
          {toast.type === 'success' && <CheckCircle2 size={18} />}
          {toast.type === 'error' && <AlertCircle size={18} />}
          {toast.type === 'info' && <Info size={18} />}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
