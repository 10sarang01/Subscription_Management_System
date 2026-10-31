import React, { useState } from 'react';
import { Mail, Send, X, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ResetPasswordModal({ onClose }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to dispatch reset request');
      }

      setMessage(data.message || `Password reset link dispatched to ${email}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(30, 41, 59, 0.45)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 50,
      padding: '20px'
    }}>
      <div className="neu-flat animate-fade-in" style={{
        maxWidth: '440px',
        width: '100%',
        padding: '30px',
        position: 'relative'
      }}>
        <button
          onClick={onClose}
          className="neu-btn"
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            width: '36px',
            height: '36px',
            padding: 0,
            borderRadius: '50%'
          }}
        >
          <X size={18} />
        </button>

        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '8px' }}>
          Reset Password
        </h3>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '20px', lineHeight: 1.5 }}>
          Enter your registered work email and we will dispatch a password reset link to your inbox.
        </p>

        {error && (
          <div style={{
            padding: '10px 14px',
            borderRadius: '10px',
            background: '#fee2e2',
            color: '#991b1b',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '16px'
          }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {message ? (
          <div style={{
            padding: '14px',
            borderRadius: '12px',
            background: '#dcfce7',
            color: '#166534',
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '20px'
          }}>
            <CheckCircle2 size={20} />
            <span>{message}</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Mail size={18} style={{ position: 'absolute', left: '16px', color: 'var(--text-muted)' }} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="registered@email.com"
                className="neu-inset neu-input"
                style={{ paddingLeft: '44px' }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="neu-btn-primary"
              style={{ padding: '12px 20px', fontSize: '0.95rem' }}
            >
              <Send size={18} />
              {loading ? 'Sending link...' : 'Send Reset Link'}
            </button>
          </form>
        )}

        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <button
            type="button"
            onClick={onClose}
            className="neu-btn"
            style={{ padding: '8px 18px', fontSize: '0.85rem' }}
          >
            Back to Sign In
          </button>
        </div>
      </div>
    </div>
  );
}
