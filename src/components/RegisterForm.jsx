import React, { useState } from 'react';
import { Mail, Lock, User, Building, Phone, CheckCircle2, XCircle, UserPlus, AlertCircle } from 'lucide-react';

export default function RegisterForm({ onRegisterSuccess }) {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    companyName: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Password criteria verification
  const password = formData.password;
  const checks = {
    length: password.length > 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    specialChar: /[!@#$%^&*(),.?":{}|<>_\-+=[\]\\/`~]/.test(password),
    matches: password.length > 0 && password === formData.confirmPassword
  };

  const isFormValid =
    formData.fullName.trim() !== '' &&
    formData.email.trim() !== '' &&
    checks.length &&
    checks.uppercase &&
    checks.lowercase &&
    checks.specialChar &&
    checks.matches;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!isFormValid) {
      setError('Please satisfy all password and required field requirements.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: formData.fullName,
          email: formData.email,
          company_name: formData.companyName,
          phone: formData.phone,
          password: formData.password
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to register account');
      }

      setSuccess('Account created successfully! You are now logged in.');
      localStorage.setItem('brightloop_token', data.token);
      localStorage.setItem('brightloop_user', JSON.stringify(data.user));

      setTimeout(() => {
        onRegisterSuccess(data.user, data.token);
      }, 1000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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

      {success && (
        <div style={{
          padding: '12px 16px',
          borderRadius: '12px',
          background: '#dcfce7',
          color: '#166534',
          fontSize: '0.88rem',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          boxShadow: 'inset 2px 2px 4px #bbf7d0, inset -2px -2px 4px #ffffff'
        }}>
          <CheckCircle2 size={18} />
          <span>{success}</span>
        </div>
      )}

      {/* Full Name */}
      <div>
        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
          Full Name *
        </label>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <User size={18} style={{ position: 'absolute', left: '16px', color: 'var(--text-muted)' }} />
          <input
            type="text"
            name="fullName"
            required
            value={formData.fullName}
            onChange={handleChange}
            placeholder="John Doe"
            className="neu-inset neu-input"
            style={{ paddingLeft: '44px' }}
          />
        </div>
      </div>

      {/* Email */}
      <div>
        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
          Business Email *
        </label>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Mail size={18} style={{ position: 'absolute', left: '16px', color: 'var(--text-muted)' }} />
          <input
            type="email"
            name="email"
            required
            value={formData.email}
            onChange={handleChange}
            placeholder="john@company.com"
            className="neu-inset neu-input"
            style={{ paddingLeft: '44px' }}
          />
        </div>
      </div>

      {/* Company Name & Phone */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
            Company Name
          </label>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Building size={16} style={{ position: 'absolute', left: '14px', color: 'var(--text-muted)' }} />
            <input
              type="text"
              name="companyName"
              value={formData.companyName}
              onChange={handleChange}
              placeholder="Acme Inc."
              className="neu-inset neu-input"
              style={{ paddingLeft: '38px', fontSize: '0.9rem' }}
            />
          </div>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
            Phone Number
          </label>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Phone size={16} style={{ position: 'absolute', left: '14px', color: 'var(--text-muted)' }} />
            <input
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+1 555-0199"
              className="neu-inset neu-input"
              style={{ paddingLeft: '38px', fontSize: '0.9rem' }}
            />
          </div>
        </div>
      </div>

      {/* Password & Confirm */}
      <div>
        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
          Password *
        </label>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Lock size={18} style={{ position: 'absolute', left: '16px', color: 'var(--text-muted)' }} />
          <input
            type="password"
            name="password"
            required
            value={formData.password}
            onChange={handleChange}
            placeholder="Min 9 chars, A-Z, a-z, special"
            className="neu-inset neu-input"
            style={{ paddingLeft: '44px' }}
          />
        </div>
      </div>

      <div>
        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
          Confirm Password *
        </label>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Lock size={18} style={{ position: 'absolute', left: '16px', color: 'var(--text-muted)' }} />
          <input
            type="password"
            name="confirmPassword"
            required
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="Confirm password"
            className="neu-inset neu-input"
            style={{ paddingLeft: '44px' }}
          />
        </div>
      </div>

      {/* Password Criteria checklist according to Brightloop spec */}
      <div style={{
        padding: '12px 14px',
        borderRadius: '12px',
        background: 'var(--bg-color)',
        boxShadow: 'inset 2px 2px 5px var(--shadow-dark), inset -2px -2px 5px var(--shadow-light)',
        fontSize: '0.78rem',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '6px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: checks.length ? '#16a34a' : 'var(--text-muted)' }}>
          {checks.length ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
          <span>&gt; 8 characters</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: checks.uppercase ? '#16a34a' : 'var(--text-muted)' }}>
          {checks.uppercase ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
          <span>Uppercase letter</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: checks.lowercase ? '#16a34a' : 'var(--text-muted)' }}>
          {checks.lowercase ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
          <span>Lowercase letter</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: checks.specialChar ? '#16a34a' : 'var(--text-muted)' }}>
          {checks.specialChar ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
          <span>Special character</span>
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading || !isFormValid}
        className="neu-btn-primary"
        style={{
          padding: '15px 24px',
          fontSize: '1rem',
          marginTop: '6px',
          opacity: isFormValid ? 1 : 0.65,
          cursor: isFormValid ? 'pointer' : 'not-allowed'
        }}
      >
        <UserPlus size={20} />
        {loading ? 'Creating Account...' : 'Register Customer Account'}
      </button>
    </form>
  );
}
