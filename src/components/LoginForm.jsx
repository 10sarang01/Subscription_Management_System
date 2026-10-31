import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, LogIn, AlertCircle, Sparkles } from 'lucide-react';

export default function LoginForm({ onLoginSuccess, onForgotPassword }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to sign in');
      }

      if (rememberMe) {
        localStorage.setItem('brightloop_token', data.token);
        localStorage.setItem('brightloop_user', JSON.stringify(data.user));
      } else {
        sessionStorage.setItem('brightloop_token', data.token);
        sessionStorage.setItem('brightloop_user', JSON.stringify(data.user));
      }

      onLoginSuccess(data.user, data.token);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fillQuickDemo = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError('');
  };

  return (
    <form onSubmit={handleSubmit} className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {error && (
        <div style={{
          padding: '12px 16px',
          borderRadius: '12px',
          background: '#fee2e2',
          color: '#991b1b',
          fontSize: '0.88rem',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          boxShadow: 'inset 2px 2px 4px #fca5a5, inset -2px -2px 4px #ffffff'
        }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Email Input */}
      <div>
        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>
          Work Email Address
        </label>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Mail size={18} style={{ position: 'absolute', left: '16px', color: 'var(--text-muted)' }} />
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@company.com"
            className="neu-inset neu-input"
            style={{ paddingLeft: '44px' }}
          />
        </div>
      </div>

      {/* Password Input */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>
            Password
          </label>
          <button
            type="button"
            onClick={onForgotPassword}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--primary)',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              textDecoration: 'none'
            }}
          >
            Forgot password?
          </button>
        </div>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Lock size={18} style={{ position: 'absolute', left: '16px', color: 'var(--text-muted)' }} />
          <input
            type={showPassword ? 'text' : 'password'}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••••••"
            className="neu-inset neu-input"
            style={{ paddingLeft: '44px', paddingRight: '44px' }}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            style={{
              position: 'absolute',
              right: '14px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>

      {/* Remember Me Checkbox */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            style={{
              width: '18px',
              height: '18px',
              accentColor: 'var(--primary)',
              cursor: 'pointer'
            }}
          />
          Keep me signed in
        </label>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className="neu-btn-primary"
        style={{ padding: '15px 24px', fontSize: '1rem', marginTop: '6px' }}
      >
        <LogIn size={20} />
        {loading ? 'Authenticating...' : 'Sign In to Brightloop'}
      </button>

      {/* Quick demo presets */}
      <div style={{ marginTop: '10px', paddingTop: '16px', borderTop: '1px solid rgba(184, 194, 204, 0.4)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '10px' }}>
          <Sparkles size={14} style={{ color: 'var(--primary)' }} />
          <span>Quick Demo Logins (Click to Autofill):</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
          <button
            type="button"
            onClick={() => fillQuickDemo('admin@brightloop.com', 'Admin@BrightLoop2026!')}
            className="neu-btn"
            style={{ padding: '8px 10px', fontSize: '0.76rem', borderRadius: '10px' }}
            title="Elena Vance (Admin)"
          >
            👑 Admin
          </button>
          <button
            type="button"
            onClick={() => fillQuickDemo('sarah.ops@brightloop.com', 'Staff@BrightLoop2026!')}
            className="neu-btn"
            style={{ padding: '8px 10px', fontSize: '0.76rem', borderRadius: '10px' }}
            title="Sarah Jenkins (Staff)"
          >
            💼 Staff
          </button>
          <button
            type="button"
            onClick={() => fillQuickDemo('alice@cornerbakery.com', 'Customer@BrightLoop2026!')}
            className="neu-btn"
            style={{ padding: '8px 10px', fontSize: '0.76rem', borderRadius: '10px' }}
            title="Alice Smith (Customer)"
          >
            🏢 Customer
          </button>
        </div>
      </div>
    </form>
  );
}
