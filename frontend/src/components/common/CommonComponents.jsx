import React from 'react';
import { Search, Filter, AlertTriangle, Inbox, CheckCircle2, Clock, ShieldAlert } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export const LoadingSpinner = ({ label }) => {
  const { t } = useLanguage();
  const displayLabel = label || t('msg.loading', 'Loading JanSahayak AI...');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem 1rem' }}>
      <div style={{
        width: '42px',
        height: '42px',
        border: '3px solid rgba(59, 130, 246, 0.2)',
        borderTop: '3px solid var(--primary)',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite'
      }} />
      <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      {displayLabel && <p style={{ marginTop: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 500 }}>{displayLabel}</p>}
    </div>
  );
};

export const ErrorState = ({ message, onRetry }) => {
  const { t } = useLanguage();
  const displayMessage = message || t('msg.networkError', 'An error occurred while loading content.');

  return (
    <div style={{
      background: 'rgba(244, 63, 94, 0.1)',
      border: '1px solid rgba(244, 63, 94, 0.3)',
      borderRadius: '16px',
      padding: '2rem',
      textAlign: 'center',
      maxWidth: '500px',
      margin: '2rem auto'
    }}>
      <ShieldAlert size={40} style={{ color: '#f43f5e', marginBottom: '0.75rem' }} />
      <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff' }}>Notice</h3>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: '0.5rem 0 1.25rem 0' }}>{displayMessage}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            background: 'rgba(244, 63, 94, 0.2)',
            border: '1px solid rgba(244, 63, 94, 0.4)',
            color: '#f43f5e',
            padding: '0.5rem 1.25rem',
            borderRadius: '8px',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          {t('btn.retry', 'Retry Action')}
        </button>
      )}
    </div>
  );
};

export const EmptyState = ({ title, message, action }) => {
  const { t } = useLanguage();
  const displayTitle = title || t('msg.noDataFound', 'No Complaints Found');
  const displayMsg = message || t('msg.noDataFound', 'No civic grievances match your active search or filter criteria.');

  return (
    <div style={{
      textAlign: 'center',
      padding: '3.5rem 1.5rem',
      background: 'rgba(18, 24, 41, 0.4)',
      border: '1px dashed var(--glass-border)',
      borderRadius: '16px',
      margin: '1.5rem 0'
    }}>
      <div style={{
        width: '54px',
        height: '54px',
        borderRadius: '50%',
        background: 'rgba(255, 255, 255, 0.05)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--text-muted)',
        marginBottom: '1rem'
      }}>
        <Inbox size={28} />
      </div>
      <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>{displayTitle}</h3>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.4rem', maxWidth: '400px', margin: '0.4rem auto 1.5rem auto' }}>
        {displayMsg}
      </p>
      {action}
    </div>
  );
};

export const Card = ({ children, className = '', style = {} }) => (
  <div className={`glass-card ${className}`} style={{ padding: '1.5rem', ...style }}>
    {children}
  </div>
);

export const Button = ({ children, onClick, variant = 'primary', type = 'button', disabled = false, style = {} }) => {
  const getVariantStyle = () => {
    switch (variant) {
      case 'secondary':
        return { background: 'rgba(255, 255, 255, 0.08)', color: 'var(--text-primary)', border: '1px solid var(--glass-border)' };
      case 'danger':
        return { background: 'rgba(244, 63, 94, 0.2)', color: '#f43f5e', border: '1px solid rgba(244, 63, 94, 0.4)' };
      case 'accent':
        return { background: 'var(--accent-gradient)', color: '#fff', border: 'none' };
      case 'emerald':
        return { background: 'var(--emerald-gradient)', color: '#fff', border: 'none' };
      default:
        return { background: 'var(--primary-gradient)', color: '#fff', border: 'none' };
    }
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: '0.65rem 1.25rem',
        borderRadius: '10px',
        fontWeight: 600,
        fontSize: '0.9rem',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        transition: 'all 0.2s ease',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        ...getVariantStyle(),
        ...style
      }}
    >
      {children}
    </button>
  );
};

export const Badge = ({ status, priority, text }) => {
  const { t } = useLanguage();
  const rawLabel = text || status || priority || 'SUBMITTED';
  const s = rawLabel.toUpperCase();

  // Translated display label using centralized t()
  let displayLabel = rawLabel;
  if (status) {
    displayLabel = t(`status.${s}`, rawLabel);
  } else if (priority) {
    displayLabel = t(`priority.${s}`, rawLabel);
  }

  let style = { bg: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', border: 'rgba(245, 158, 11, 0.3)' };

  if (s === 'RESOLVED' || s === 'LOW') {
    style = { bg: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: 'rgba(16, 185, 129, 0.3)' };
  } else if (s === 'IN_PROGRESS' || s === 'MEDIUM') {
    style = { bg: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', border: 'rgba(59, 130, 246, 0.3)' };
  } else if (s === 'ESCALATED' || s === 'HIGH' || s === 'URGENT' || s === 'CRITICAL') {
    style = { bg: 'rgba(244, 63, 94, 0.15)', color: '#f43f5e', border: 'rgba(244, 63, 94, 0.3)' };
  }

  return (
    <span style={{
      background: style.bg,
      color: style.color,
      border: `1px solid ${style.border}`,
      padding: '0.25rem 0.65rem',
      borderRadius: '20px',
      fontSize: '0.75rem',
      fontWeight: 700,
      letterSpacing: '0.03em',
      textTransform: 'uppercase',
      display: 'inline-block'
    }}>
      {displayLabel}
    </span>
  );
};

export const SearchFilterBar = ({ search, setSearch, filterCategory, setFilterCategory, filterStatus, setFilterStatus }) => {
  const { t } = useLanguage();

  return (
    <div style={{
      display: 'flex',
      flexWrap: 'wrap',
      gap: '1rem',
      marginBottom: '1.5rem',
      background: 'rgba(18, 24, 41, 0.6)',
      padding: '1rem',
      borderRadius: '14px',
      border: '1px solid var(--glass-border)'
    }}>
      <div style={{ flex: '1 1 240px', position: 'relative' }}>
        <input
          type="text"
          placeholder={t('form.searchPlaceholder', 'Search grievance title, ID, or location...')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: '100%',
            padding: '0.65rem 1rem 0.65rem 2.5rem',
            background: 'rgba(10, 14, 26, 0.7)',
            border: '1px solid var(--glass-border)',
            borderRadius: '10px',
            color: 'var(--text-primary)',
            fontSize: '0.88rem',
            outline: 'none'
          }}
        />
        <Search size={18} style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
      </div>

      {setFilterCategory && (
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          style={{
            padding: '0.65rem 1rem',
            background: 'rgba(10, 14, 26, 0.7)',
            border: '1px solid var(--glass-border)',
            borderRadius: '10px',
            color: 'var(--text-primary)',
            fontSize: '0.88rem',
            outline: 'none'
          }}
        >
          <option value="ALL">All Categories</option>
          <option value="Water Supply">Water Supply</option>
          <option value="Roads & Transport">Roads & Transport</option>
          <option value="Sanitation">Sanitation</option>
          <option value="Electricity">Electricity</option>
        </select>
      )}

      {setFilterStatus && (
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          style={{
            padding: '0.65rem 1rem',
            background: 'rgba(10, 14, 26, 0.7)',
            border: '1px solid var(--glass-border)',
            borderRadius: '10px',
            color: 'var(--text-primary)',
            fontSize: '0.88rem',
            outline: 'none'
          }}
        >
          <option value="ALL">All Statuses</option>
          <option value="SUBMITTED">{t('status.SUBMITTED', 'Submitted')}</option>
          <option value="IN_PROGRESS">{t('status.IN_PROGRESS', 'In Progress')}</option>
          <option value="RESOLVED">{t('status.RESOLVED', 'Resolved')}</option>
          <option value="ESCALATED">{t('status.ESCALATED', 'Escalated')}</option>
        </select>
      )}
    </div>
  );
};

export const ProgressStepper = ({ currentStatus = 'SUBMITTED' }) => {
  const { t } = useLanguage();

  const steps = [
    { key: 'SUBMITTED', label: t('status.SUBMITTED', 'Grievance Filed'), desc: 'Received & AI Analyzed' },
    { key: 'IN_PROGRESS', label: t('status.IN_PROGRESS', 'Officer Dispatched'), desc: 'Assigned & Site Inspection' },
    { key: 'RESOLVED', label: t('status.RESOLVED', 'Issue Resolved'), desc: 'Fixed & Verified' }
  ];

  const getStepIndex = (status) => {
    if (status === 'RESOLVED') return 2;
    if (status === 'IN_PROGRESS' || status === 'ESCALATED') return 1;
    return 0;
  };

  const activeIndex = getStepIndex(currentStatus);

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', margin: '2rem 0' }}>
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '10%',
        right: '10%',
        height: '3px',
        background: 'var(--glass-border)',
        zIndex: 0
      }} />
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '10%',
        width: `${activeIndex * 40}%`,
        height: '3px',
        background: 'var(--primary-gradient)',
        transition: 'width 0.4s ease',
        zIndex: 0
      }} />

      {steps.map((step, idx) => {
        const isDone = idx <= activeIndex;
        return (
          <div key={step.key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1, position: 'relative' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: isDone ? 'var(--primary-gradient)' : 'var(--bg-secondary)',
              border: isDone ? '2px solid var(--primary)' : '2px solid var(--glass-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 700,
              boxShadow: isDone ? '0 0 16px rgba(59, 130, 246, 0.5)' : 'none'
            }}>
              {isDone ? <CheckCircle2 size={20} /> : idx + 1}
            </div>
            <span style={{ marginTop: '0.6rem', fontSize: '0.88rem', fontWeight: isDone ? 700 : 500, color: isDone ? '#fff' : 'var(--text-muted)' }}>
              {step.label}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{step.desc}</span>
          </div>
        );
      })}
    </div>
  );
};
