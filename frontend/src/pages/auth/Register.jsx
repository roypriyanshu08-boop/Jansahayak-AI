import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Card, Button } from '../../components/common/CommonComponents';
import { User, Mail, Phone, Lock, UserCheck, Shield } from 'lucide-react';

export const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'citizen'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register, login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validateForm = () => {
    const cleanName = formData.name.trim();
    if (!cleanName) {
      setError('Full name is required.');
      return false;
    }

    const cleanEmail = formData.email.trim();
    if (!cleanEmail) {
      setError('Email address is required.');
      return false;
    }

    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(cleanEmail)) {
      setError('Please enter a valid email address.');
      return false;
    }

    const cleanPhone = formData.phone.trim();
    if (!cleanPhone || cleanPhone.replace(/\D/g, '').length < 10) {
      setError('Please enter a valid phone number (at least 10 digits).');
      return false;
    }

    if (!formData.password) {
      setError('Password is required.');
      return false;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    const cleanData = {
      name: formData.name.trim(),
      email: formData.email.trim().toLowerCase(),
      phone: formData.phone.trim(),
      password: formData.password,
      role: formData.role || 'citizen'
    };

    try {
      await register(cleanData);
      navigate('/login', { state: { message: 'Registration successful. Please login.' } });
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: 'calc(100vh - 80px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem'
    }}>
      <Card style={{ width: '100%', maxWidth: '480px', padding: '2.5rem 2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{
            width: '50px',
            height: '50px',
            borderRadius: '14px',
            background: 'var(--accent-gradient)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            marginBottom: '1rem',
            boxShadow: '0 8px 24px rgba(139, 92, 246, 0.4)'
          }}>
            <Shield size={28} />
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Create JanSahayak Account</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.4rem' }}>
            Register as a Citizen or Administration Officer
          </p>
        </div>

        {error && (
          <div style={{
            background: 'rgba(244, 63, 94, 0.15)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            color: '#f43f5e',
            padding: '0.75rem',
            borderRadius: '10px',
            fontSize: '0.85rem',
            marginBottom: '1.25rem',
            textAlign: 'center',
            fontWeight: 600
          }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          <div>
            <label style={labelStyle}>Full Name</label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                name="name"
                placeholder="Ramesh Kumar"
                value={formData.name}
                onChange={handleChange}
                style={{ ...inputStyle, paddingLeft: '2.5rem' }}
              />
              <User size={18} style={iconStyle} />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Email Address</label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                name="email"
                placeholder="ramesh@example.com"
                value={formData.email}
                onChange={handleChange}
                style={{ ...inputStyle, paddingLeft: '2.5rem' }}
              />
              <Mail size={18} style={iconStyle} />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Phone Number</label>
            <div style={{ position: 'relative' }}>
              <input
                type="tel"
                name="phone"
                placeholder="9876543210"
                value={formData.phone}
                onChange={handleChange}
                style={{ ...inputStyle, paddingLeft: '2.5rem' }}
              />
              <Phone size={18} style={iconStyle} />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Account Role</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              style={{ ...inputStyle, paddingLeft: '1rem' }}
            >
              <option value="citizen">Citizen</option>
              <option value="admin">Administrator / Admin</option>
            </select>
          </div>

          <div>
            <label style={labelStyle}>Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                name="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                style={{ ...inputStyle, paddingLeft: '2.5rem' }}
              />
              <Lock size={18} style={iconStyle} />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Confirm Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                name="confirmPassword"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={handleChange}
                style={{ ...inputStyle, paddingLeft: '2.5rem' }}
              />
              <Lock size={18} style={iconStyle} />
            </div>
          </div>

          <Button type="submit" variant="accent" disabled={loading} style={{ width: '100%', marginTop: '0.4rem' }}>
            {loading ? 'Registering...' : 'Register Account'} <UserCheck size={18} />
          </Button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
          Already registered?{' '}
          <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>
            Sign In Here
          </Link>
        </p>
      </Card>
    </div>
  );
};

const labelStyle = {
  display: 'block',
  fontSize: '0.85rem',
  fontWeight: 600,
  color: 'var(--text-secondary)',
  marginBottom: '0.4rem'
};

const inputStyle = {
  width: '100%',
  padding: '0.75rem 1rem',
  background: 'rgba(10, 14, 26, 0.6)',
  border: '1px solid var(--glass-border)',
  borderRadius: '10px',
  color: 'var(--text-primary)',
  fontSize: '0.9rem',
  outline: 'none'
};

const iconStyle = {
  position: 'absolute',
  left: '0.8rem',
  top: '50%',
  transform: 'translateY(-50%)',
  color: 'var(--text-muted)'
};
