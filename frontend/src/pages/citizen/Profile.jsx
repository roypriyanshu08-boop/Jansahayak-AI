import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Card, Button, Badge } from '../../components/common/CommonComponents';
import { User, Mail, Phone, Shield, Calendar, Bell, FileText } from 'lucide-react';

export const Profile = () => {
  const { user, logout } = useAuth();

  return (
    <div className="main-content" style={{ maxWidth: '750px' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Account Profile</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.4rem' }}>
          Registered citizen details and JanSahayak portal preferences
        </p>
      </div>

      <Card style={{ marginBottom: '1.5rem', textAlign: 'center', padding: '2.5rem 2rem' }}>
        <div style={{
          width: '70px',
          height: '70px',
          borderRadius: '50%',
          background: 'var(--primary-gradient)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontSize: '1.8rem',
          fontWeight: 800,
          marginBottom: '1rem',
          boxShadow: '0 8px 24px rgba(59, 130, 246, 0.4)'
        }}>
          {user?.name ? user.name[0].toUpperCase() : 'U'}
        </div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>{user?.name || 'Citizen User'}</h2>
        <div style={{ marginTop: '0.4rem' }}>
          <Badge status={user?.role === 'admin' ? 'HIGH' : 'RESOLVED'} text={`Role: ${user?.role || 'Citizen'}`} />
        </div>
      </Card>

      <Card style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.25rem' }}>Personal Information</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.95rem' }}>
            <Mail size={18} style={{ color: 'var(--primary)' }} />
            <span style={{ color: 'var(--text-muted)' }}>Email:</span>
            <strong style={{ color: 'var(--text-primary)' }}>{user?.email || 'citizen@example.com'}</strong>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.95rem' }}>
            <Phone size={18} style={{ color: 'var(--accent)' }} />
            <span style={{ color: 'var(--text-muted)' }}>Phone:</span>
            <strong style={{ color: 'var(--text-primary)' }}>{user?.phone || '+91 9876543210'}</strong>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.95rem' }}>
            <Shield size={18} style={{ color: 'var(--emerald)' }} />
            <span style={{ color: 'var(--text-muted)' }}>User ID:</span>
            <strong style={{ color: 'var(--text-primary)', fontFamily: 'monospace' }}>{user?.id || 'usr-101'}</strong>
          </div>
        </div>
      </Card>

      <Card>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.25rem' }}>Notification Settings</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9rem', cursor: 'pointer' }}>
            <input type="checkbox" defaultChecked style={{ width: '18px', height: '18px' }} />
            Receive instant SMS alerts when grievance status changes
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9rem', cursor: 'pointer' }}>
            <input type="checkbox" defaultChecked style={{ width: '18px', height: '18px' }} />
            Email summary report on assigned field officer actions
          </label>
        </div>
      </Card>
    </div>
  );
};
