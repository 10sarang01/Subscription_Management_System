import React, { useState, useEffect } from 'react';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';
import ResetPasswordModal from './components/ResetPasswordModal';
import Dashboard from './components/Dashboard';
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
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div className="neu-flat" style={{ padding: '24px 32px', fontWeight: 600, color: 'var(--text-muted)' }}>
          Loading Brightloop Systems...
        </div>
      </div>
    );
  }

  return (
    <div style={{
      width: '100%',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: '40px 20px',
      alignItems: 'center'
    }}>
      {/* Top Header / Brand */}
      <header style={{ marginBottom: '32px', textAlign: 'center' }}>
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
          Subscription Management Platform • User Access Portal
        </p>
      </header>

      {/* Main Container */}
      <main style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
        {currentUser ? (
          <Dashboard user={currentUser} token={token} onLogout={handleLogout} />
        ) : (
          <div className="neu-flat animate-fade-in" style={{
            width: '100%',
            maxWidth: '480px',
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
                New Customer
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
        )}
      </main>

      {/* Reset Password Modal */}
      {showForgotModal && (
        <ResetPasswordModal onClose={() => setShowForgotModal(false)} />
      )}

      {/* Footer Info */}
      <footer style={{
        marginTop: '40px',
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
          <span>Local Database: <strong>SQLite (users.db)</strong></span>
        </div>
        <span>•</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <ShieldCheck size={14} />
          <span>Admin Initialized: <strong>Elena Vance (admin@brightloop.com)</strong></span>
        </div>
        <span>•</span>
        <span>Neumorphic CSS UI</span>
      </footer>
    </div>
  );
}
