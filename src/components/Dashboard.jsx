import React, { useState, useEffect } from 'react';
import { LogOut, User, Shield, Users, UserPlus, Building, Phone, Mail, CheckCircle2, AlertCircle, RefreshCw, KeyRound, Database } from 'lucide-react';

export default function Dashboard({ user, token, onLogout }) {
  const [usersList, setUsersList] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [staffForm, setStaffForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: ''
  });
  const [staffLoading, setStaffLoading] = useState(false);
  const [staffError, setStaffError] = useState('');
  const [staffSuccess, setStaffSuccess] = useState('');

  const isAdmin = user.role === 'admin';
  const isStaff = user.role === 'staff';
  const isCustomer = user.role === 'customer';

  // Fetch users from local sqlite db for admin and staff
  const fetchUsers = async () => {
    if (!isAdmin && !isStaff) return;
    setLoadingUsers(true);
    try {
      const res = await fetch('/api/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setUsersList(data.users || []);
      }
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [user.role, token]);

  const handleAddStaff = async (e) => {
    e.preventDefault();
    setStaffError('');
    setStaffSuccess('');
    setStaffLoading(true);

    try {
      const res = await fetch('/api/users/staff', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          full_name: staffForm.fullName,
          email: staffForm.email,
          phone: staffForm.phone,
          password: staffForm.password
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to add staff member');
      }

      setStaffSuccess(`Staff member ${data.user.full_name} added!`);
      setStaffForm({ fullName: '', email: '', phone: '', password: '' });
      fetchUsers();
      setTimeout(() => setShowAddStaff(false), 2000);
    } catch (err) {
      setStaffError(err.message);
    } finally {
      setStaffLoading(false);
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return <span className="neu-pill pill-admin">👑 Admin</span>;
      case 'staff':
        return <span className="neu-pill pill-staff">💼 Staff</span>;
      default:
        return <span className="neu-pill pill-customer">🏢 Customer</span>;
    }
  };

  return (
    <div className="animate-fade-in" style={{ width: '100%', maxWidth: '980px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Top Bar / Profile Card */}
      <div className="neu-flat" style={{ padding: '24px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
          <div className="neu-flat-sm" style={{ width: '56px', height: '56px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
            <User size={28} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800 }}>{user.full_name}</h2>
              {getRoleBadge(user.role)}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '4px', fontSize: '0.86rem', color: 'var(--text-muted)' }}>
              <span>{user.email}</span>
              {user.company_name && <span>• {user.company_name}</span>}
              {user.phone && <span>• {user.phone}</span>}
            </div>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="neu-btn"
          style={{ padding: '12px 20px', color: 'var(--error)' }}
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </div>

      {/* Role Notice & Database Badge */}
      <div className="neu-inset" style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', fontSize: '0.88rem' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Shield size={16} style={{ color: 'var(--primary)' }} />
          <span>Role Policy: {isAdmin ? 'Full System Control (Admin)' : isStaff ? 'Internal Staff (Day-to-day work)' : 'Customer Self-Service Portal'}</span>
        </div>
      </div>

      {/* Admin Quick Action: Add Staff Member */}
      {isAdmin && (
        <div className="neu-flat" style={{ padding: '24px 30px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: showAddStaff ? '20px' : '0' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <UserPlus size={20} style={{ color: 'var(--primary)' }} />
                Staff Management (Admin Restricted)
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Only the admin has authority to onboard new internal staff members.
              </p>
            </div>
            <button
              onClick={() => setShowAddStaff(!showAddStaff)}
              className="neu-btn"
              style={{ padding: '10px 18px', fontSize: '0.88rem' }}
            >
              {showAddStaff ? 'Cancel' : '+ Add New Staff'}
            </button>
          </div>

          {showAddStaff && (
            <form onSubmit={handleAddStaff} className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '14px', paddingTop: '16px', borderTop: '1px solid rgba(184, 194, 204, 0.4)' }}>
              {staffError && (
                <div style={{ padding: '10px 14px', borderRadius: '10px', background: '#fee2e2', color: '#991b1b', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertCircle size={16} />
                  <span>{staffError}</span>
                </div>
              )}
              {staffSuccess && (
                <div style={{ padding: '10px 14px', borderRadius: '10px', background: '#dcfce7', color: '#166534', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle2 size={16} />
                  <span>{staffSuccess}</span>
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>Staff Full Name</label>
                  <input
                    type="text"
                    required
                    value={staffForm.fullName}
                    onChange={(e) => setStaffForm({ ...staffForm, fullName: e.target.value })}
                    placeholder="e.g. Marcus Vance"
                    className="neu-inset neu-input"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>Staff Email</label>
                  <input
                    type="email"
                    required
                    value={staffForm.email}
                    onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
                    placeholder="marcus@brightloop.com"
                    className="neu-inset neu-input"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>Staff Phone</label>
                  <input
                    type="text"
                    value={staffForm.phone}
                    onChange={(e) => setStaffForm({ ...staffForm, phone: e.target.value })}
                    placeholder="+1 555-0103"
                    className="neu-inset neu-input"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>Temporary Password</label>
                  <input
                    type="password"
                    required
                    value={staffForm.password}
                    onChange={(e) => setStaffForm({ ...staffForm, password: e.target.value })}
                    placeholder=">8 chars, A-Z, a-z, special"
                    className="neu-inset neu-input"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
                <button
                  type="submit"
                  disabled={staffLoading}
                  className="neu-btn-primary"
                  style={{ padding: '10px 22px', fontSize: '0.9rem' }}
                >
                  <UserPlus size={16} />
                  {staffLoading ? 'Registering Staff...' : 'Create Staff Member'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Admin & Staff View: Live Users Directory from SQLite */}
      {(isAdmin || isStaff) && (
        <div className="neu-flat" style={{ padding: '24px 30px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users size={20} style={{ color: 'var(--primary)' }} />
                Users Directory ({usersList.length} Accounts)
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Manage team and customer accounts.
              </p>
            </div>
            <button
              onClick={fetchUsers}
              disabled={loadingUsers}
              className="neu-btn"
              style={{ padding: '8px 14px', fontSize: '0.82rem' }}
            >
              <RefreshCw size={14} className={loadingUsers ? 'spin' : ''} />
              Refresh
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ color: 'var(--text-muted)', textAlign: 'left', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  <th style={{ padding: '8px 14px' }}>ID</th>
                  <th style={{ padding: '8px 14px' }}>Name</th>
                  <th style={{ padding: '8px 14px' }}>Email</th>
                  <th style={{ padding: '8px 14px' }}>Role</th>
                  <th style={{ padding: '8px 14px' }}>Company</th>
                  <th style={{ padding: '8px 14px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {usersList.map((u) => (
                  <tr key={u.id} className="neu-flat-sm" style={{ transition: 'transform 0.15s ease' }}>
                    <td style={{ padding: '14px', fontWeight: 700, color: 'var(--text-muted)' }}>#{u.id}</td>
                    <td style={{ padding: '14px', fontWeight: 700 }}>{u.full_name}</td>
                    <td style={{ padding: '14px', color: 'var(--text-muted)' }}>{u.email}</td>
                    <td style={{ padding: '14px' }}>{getRoleBadge(u.role)}</td>
                    <td style={{ padding: '14px', color: 'var(--text-muted)' }}>{u.company_name || '—'}</td>
                    <td style={{ padding: '14px' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        color: u.is_active ? '#16a34a' : '#dc2626',
                        fontWeight: 600,
                        fontSize: '0.82rem'
                      }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: u.is_active ? '#16a34a' : '#dc2626' }}></span>
                        {u.is_active ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Customer View */}
      {isCustomer && (
        <div className="neu-flat" style={{ padding: '30px' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '10px' }}>
            Customer Self-Service Portal
          </h3>
          <p style={{ color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '24px' }}>
            Welcome back, <strong>{user.full_name}</strong>! As specified in Brightloop's platform rules, customers have direct access to self-service management for their subscriptions, invoices, and billing history.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            <div className="neu-flat-sm" style={{ padding: '20px' }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Account Entity</span>
              <h4 style={{ fontSize: '1.1rem', marginTop: '6px', fontWeight: 700 }}>{user.company_name || 'Individual Account'}</h4>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '4px' }}>Verified customer account</p>
            </div>

            <div className="neu-flat-sm" style={{ padding: '20px' }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Registered Email</span>
              <h4 style={{ fontSize: '1.1rem', marginTop: '6px', fontWeight: 700 }}>{user.email}</h4>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '4px' }}>Primary contact for invoices</p>
            </div>

            <div className="neu-flat-sm" style={{ padding: '20px' }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Security Status</span>
              <h4 style={{ fontSize: '1.1rem', marginTop: '6px', fontWeight: 700, color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle2 size={18} /> Protected
              </h4>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '4px' }}>Password meets Brightloop rules</p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
