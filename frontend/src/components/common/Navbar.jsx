import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../context/LanguageContext';
import { LanguageSwitcher } from './LanguageSwitcher';
import { NotificationBell } from './NotificationBell';
import {
  Shield, LogOut, User as UserIcon, LayoutDashboard, PlusCircle, BarChart3,
  Users, Layers, MapPin, AlertTriangle, Cpu, MessageSquare, FileText, Menu, X, Home, Mic, Bell
} from 'lucide-react';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
    navigate('/login');
  };

  const isActive = (path) => location.pathname + location.search === path || (path === '/create-complaint' && location.pathname === '/create-complaint');

  const citizenNavItems = [
    { label: t('nav.home', 'Home'), path: '/', icon: Home },
    { label: t('nav.voiceComplaint', 'Voice Complaint'), path: '/create-complaint?mode=voice', icon: Mic },
    { label: t('nav.submitForm', 'Submit Form'), path: '/create-complaint?mode=text', icon: PlusCircle },
    { label: t('nav.myComplaints', 'My Complaints'), path: '/my-complaints', icon: FileText },
    { label: t('nav.trackComplaint', 'Track Complaint'), path: '/track', icon: Layers },
    { label: t('nav.askJanSahayak', 'Ask JanSahayak'), path: '/ask-ai', icon: MessageSquare },
    { label: t('nav.notifications', 'Notifications'), path: '/notifications', icon: Bell },
    { label: t('nav.profile', 'Profile'), path: '/profile', icon: UserIcon },
  ];

  const adminNavItems = [
    { label: t('nav.dashboard', 'Dashboard'), path: '/admin', icon: LayoutDashboard },
    { label: t('nav.complaints', 'Complaints'), path: '/admin/complaints', icon: Layers },
    { label: t('nav.map', 'Map'), path: '/admin/map', icon: MapPin },
    { label: t('nav.analytics', 'Analytics'), path: '/admin/analytics', icon: BarChart3 },
    { label: t('nav.officers', 'Officers'), path: '/admin/officers', icon: Users },
    { label: t('nav.escalations', 'Escalations'), path: '/admin/escalations', icon: AlertTriangle },
    { label: t('nav.aiInsights', 'AI Insights'), path: '/admin/ai-insights', icon: Cpu },
  ];

  const currentNavItems = user?.role === 'admin' ? adminNavItems : citizenNavItems;

  return (
    <header style={{
      background: 'rgba(10, 14, 26, 0.95)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--glass-border)',
      position: 'sticky',
      top: 0,
      zIndex: 1000
    }}>
      {/* Official Government Top Ribbon Bar */}
      <div style={{
        background: 'linear-gradient(90deg, #1e293b 0%, #0f172a 100%)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
        padding: '0.25rem 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '0.75rem',
        color: 'var(--text-muted)'
      }}>
        <div>JanSahayak AI — Citizen Grievance & Technology Platform (Prototype)</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <span style={{ color: '#fbbf24' }}>Government portal integration: Not connected</span>
          <span style={{ color: 'var(--emerald)' }}>● System Operational</span>
          <LanguageSwitcher variant="compact" />
        </div>
      </div>

      <nav style={{
        padding: '0.75rem 2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        {/* Brand Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'var(--primary-gradient)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 4px 14px rgba(59, 130, 246, 0.4)'
          }}>
            <Shield size={24} />
          </div>
          <div>
            <span style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', display: 'block' }}>
              JanSahayak <span className="gradient-text">AI</span>
            </span>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Public Grievance System
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <div style={{ display: 'none', mdDisplay: 'flex', alignItems: 'center', gap: '0.4rem' }} className="desktop-menu">
          {user && currentNavItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.5rem 0.85rem',
                  borderRadius: '8px',
                  color: active ? '#fff' : 'var(--text-secondary)',
                  background: active ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                  border: active ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid transparent',
                  textDecoration: 'none',
                  fontSize: '0.85rem',
                  fontWeight: active ? 700 : 500,
                  transition: 'all 0.2s ease'
                }}
              >
                <Icon size={16} style={{ color: active ? 'var(--primary)' : 'inherit' }} />
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* Desktop User / Auth controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }} className="desktop-menu">
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '1px solid var(--glass-border)', paddingLeft: '1rem' }}>
              {/* Notification Bell Component */}
              <NotificationBell />

              <Link to="/profile" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: user.role === 'admin' ? 'var(--accent-gradient)' : 'var(--primary-gradient)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontSize: '0.85rem',
                  fontWeight: 700
                }}>
                  {user.name ? user.name[0].toUpperCase() : 'U'}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 600 }}>{user.name}</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{user.role}</span>
                </div>
              </Link>

              <button
                onClick={handleLogout}
                style={{
                  background: 'rgba(244, 63, 94, 0.1)',
                  border: '1px solid rgba(244, 63, 94, 0.3)',
                  color: '#f43f5e',
                  padding: '0.4rem 0.75rem',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  fontSize: '0.8rem',
                  fontWeight: 600
                }}
              >
                <LogOut size={14} /> {t('nav.logout', 'Exit')}
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <Link to="/login" style={{
                color: 'var(--text-primary)',
                textDecoration: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                fontSize: '0.85rem',
                fontWeight: 600,
                border: '1px solid var(--glass-border)'
              }}>{t('nav.login', 'Login')}</Link>
              <Link to="/register" style={{
                background: 'var(--primary-gradient)',
                color: '#fff',
                textDecoration: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                fontSize: '0.85rem',
                fontWeight: 600,
                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
              }}>{t('nav.register', 'Register')}</Link>
            </div>
          )}
        </div>

        {/* Mobile Hamburger Toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          style={{
            display: 'block',
            background: 'none',
            border: 'none',
            color: 'var(--text-primary)',
            cursor: 'pointer'
          }}
          aria-label="Toggle menu"
          className="mobile-toggle"
        >
          {mobileMenuOpen ? <X size={26} /> : <Menu size={26} />}
        </button>
      </nav>

      {/* Mobile Drawer Dropdown */}
      {mobileMenuOpen && (
        <div style={{
          background: 'var(--bg-secondary)',
          borderBottom: '1px solid var(--glass-border)',
          padding: '1rem 1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--glass-border)' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Language / भाषा:</span>
            <LanguageSwitcher variant="pill" />
          </div>

          {user && currentNavItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  color: active ? '#fff' : 'var(--text-secondary)',
                  background: active ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                  textDecoration: 'none',
                  fontSize: '0.9rem',
                  fontWeight: 600
                }}
              >
                <Icon size={18} /> {item.label}
              </Link>
            );
          })}

          {!user ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
              <Link to="/login" onClick={() => setMobileMenuOpen(false)} style={{ textDecoration: 'none', color: '#fff', textAlign: 'center', padding: '0.75rem', border: '1px solid var(--glass-border)', borderRadius: '8px' }}>{t('nav.login', 'Login')}</Link>
              <Link to="/register" onClick={() => setMobileMenuOpen(false)} style={{ textDecoration: 'none', color: '#fff', textAlign: 'center', padding: '0.75rem', background: 'var(--primary-gradient)', borderRadius: '8px' }}>{t('nav.register', 'Register')}</Link>
            </div>
          ) : (
            <button
              onClick={handleLogout}
              style={{
                marginTop: '1rem',
                width: '100%',
                padding: '0.75rem',
                background: 'rgba(244, 63, 94, 0.2)',
                color: '#f43f5e',
                border: '1px solid rgba(244, 63, 94, 0.4)',
                borderRadius: '8px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              {t('nav.logout', 'Logout Account')}
            </button>
          )}
        </div>
      )}

      {/* Media query styling inline */}
      <style>{`
        @media (min-width: 768px) {
          .desktop-menu { display: flex !important; }
          .mobile-toggle { display: none !important; }
        }
      `}</style>
    </header>
  );
};
