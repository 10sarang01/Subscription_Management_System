import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';
import ResetPasswordModal from './components/ResetPasswordModal';
import Layout from './components/Layout';
import OverviewPage from './pages/OverviewPage';
import ProductsPage from './pages/ProductsPage';
import SubscriptionsPage from './pages/SubscriptionsPage';
import BillingPage from './pages/BillingPage';
import DiscountsPage from './pages/DiscountsPage';
import PaymentsPage from './pages/PaymentsPage';
import CustomerPortalPage from './pages/CustomerPortalPage';
import TeamPage from './pages/TeamPage';
import { SubscriptionProvider } from './context/SubscriptionContext';
import { Layers, ShieldCheck, Database } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(null);
  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'register'
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Restore session from localStorage or sessionStorage
  useEffect(() => {
    const savedToken = localStorage.getItem('brightloop_token') || sessionStorage.getItem('brightloop_token');
    const savedUser = localStorage.getItem('brightloop_user') || sessionStorage.getItem('brightloop_user');

    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setCurrentUser(JSON.parse(savedUser));
      } catch (err) {
        console.error('Failed to parse stored user:', err);
      }
    }
    setCheckingAuth(false);
  }, []);

  const handleLoginSuccess = (user, authToken) => {
    setCurrentUser(user);
    setToken(authToken);
  };

  const handleLogout = () => {
    localStorage.removeItem('brightloop_token');
    localStorage.removeItem('brightloop_user');
    sessionStorage.removeItem('brightloop_token');
    sessionStorage.removeItem('brightloop_user');
    setCurrentUser(null);
    setToken(null);
  };

  if (checkingAuth) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', width: '100vw' }}>
        <div className="neu-flat" style={{ padding: '24px 32px', fontWeight: 600, color: 'var(--text-muted)' }}>
          Loading Brightloop Systems...
        </div>
      </div>
    );
  }

  // If user is authenticated, render the Enterprise App Shell & Routes
  if (currentUser) {
    return (
      <SubscriptionProvider initialUser={currentUser}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout onLogout={handleLogout} />}>
              <Route index element={<OverviewPage />} />
              <Route path="products" element={<ProductsPage />} />
              <Route path="quotes" element={<SubscriptionsPage />} />
              <Route path="billing" element={<BillingPage />} />
              <Route path="discounts" element={<DiscountsPage />} />
              <Route path="payments" element={<PaymentsPage />} />
              <Route path="portal" element={<CustomerPortalPage />} />
              <Route path="team" element={<TeamPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </SubscriptionProvider>
    );
  }

  // Non-authenticated View: Sign In / Customer Registration
  return (
    <div style={{
      width: '100vw',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: '40px 20px',
      alignItems: 'center',
      backgroundColor: 'var(--bg-color)'
    }}>
      {/* Top Header / Brand */}
      <header style={{ marginBottom: '24px', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '14px', marginBottom: '8px' }}>
          <div className="neu-flat-sm" style={{
            width: '46px',
            height: '46px',
            borderRadius: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--primary)',
            background: 'linear-gradient(135deg, #e2e8f0, #cbd5e1)'
          }}>
            <Layers size={26} />
          </div>
          <h1 style={{
            fontSize: '1.85rem',
            fontWeight: 800,
            letterSpacing: '-0.02em',
            color: '#1e293b'
          }}>
            Brightloop <span style={{ color: 'var(--primary)' }}>Systems</span>
          </h1>
        </div>
        <p style={{ fontSize: '0.92rem', color: 'var(--text-muted)', fontWeight: 500 }}>
          Enterprise Subscription & Recurring Billing Platform
        </p>
      </header>

      {/* Main Container */}
      <main style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
        {/* Authentication Card */}
        <div className="neu-flat animate-fade-in" style={{
          width: '100%',
          maxWidth: '520px',
          padding: '36px 32px',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px'
        }}>
          {/* Neumorphic Tab Toggle */}
          <div className="neu-tabs">
            <button
              type="button"
              className={`neu-tab ${activeTab === 'login' ? 'active' : ''}`}
              onClick={() => setActiveTab('login')}
            >
              Sign In
            </button>
            <button
              type="button"
              className={`neu-tab ${activeTab === 'register' ? 'active' : ''}`}
              onClick={() => setActiveTab('register')}
            >
              New Customer Registration
            </button>
          </div>

          {/* Forms */}
          {activeTab === 'login' ? (
            <LoginForm
              onLoginSuccess={handleLoginSuccess}
              onForgotPassword={() => setShowForgotModal(true)}
            />
          ) : (
            <RegisterForm
              onRegisterSuccess={handleLoginSuccess}
            />
          )}
        </div>
      </main>

      {/* Reset Password Modal */}
      {showForgotModal && (
        <ResetPasswordModal onClose={() => setShowForgotModal(false)} />
      )}

      {/* Footer Info */}
      <footer style={{
        marginTop: '32px',
        textAlign: 'center',
        fontSize: '0.82rem',
        color: 'var(--text-muted)',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        flexWrap: 'wrap',
        justifyContent: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Database size={14} />
          <span>Local SQLite: <strong>users.db</strong></span>
        </div>
        <span>•</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <ShieldCheck size={14} />
          <span>Admin Role Initialized: <strong>Elena Vance</strong></span>
        </div>
        <span>•</span>
        <span>Neumorphic Enterprise Soft UI</span>
      </footer>
    </div>
  );
}
