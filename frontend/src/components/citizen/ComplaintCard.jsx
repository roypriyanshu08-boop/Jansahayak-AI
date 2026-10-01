import React from 'react';
import { Card, Badge } from '../common/CommonComponents';
import { useLanguage } from '../../context/LanguageContext';
import { MapPin, Calendar, Tag, AlertOctagon, ArrowRight, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

export const ComplaintCard = ({ complaint }) => {
  const { t, language } = useLanguage();
  if (!complaint) return null;

  const displayId = complaint.id ? `#${complaint.id.substring(0, 8)}` : '#CMP-000';
  const categoryLabel = t(`category.${complaint.category}`, complaint.category || 'General Civic');
  const dateFormatted = complaint.created_at 
    ? new Date(complaint.created_at).toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })
    : 'Recent';

  return (
    <Card style={{ 
      padding: '1.25rem',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      border: '1px solid var(--glass-border)',
      background: 'rgba(18, 24, 41, 0.75)',
      borderRadius: '16px',
      transition: 'transform 0.2s ease, border-color 0.2s ease',
      boxShadow: '0 4px 20px rgba(0,0,0,0.12)'
    }}>
      <div>
        {/* Top Header: ID & Status + Priority Badges */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', gap: '0.5rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.8rem', color: '#60a5fa', fontWeight: 800, fontFamily: 'monospace', letterSpacing: '0.03em' }}>
              {displayId}
            </span>
            {(complaint.title?.includes('[DEMO DATA]') || complaint.is_demo_record) && (
              <span style={{
                fontSize: '0.66rem',
                fontWeight: 800,
                padding: '0.15rem 0.45rem',
                borderRadius: '6px',
                background: 'rgba(245, 158, 11, 0.25)',
                color: '#fcd34d',
                border: '1px solid rgba(245, 158, 11, 0.4)'
              }}>
                DEMO DATA
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            <Badge priority={complaint.priority || 'MEDIUM'} />
            <Badge status={complaint.status || 'SUBMITTED'} />
          </div>
        </div>

        {/* Complaint Title */}
        <h3 style={{ fontSize: '1.08rem', fontWeight: 800, color: '#fff', marginBottom: '0.5rem', lineHeight: 1.4 }}>
          {complaint.title}
        </h3>

        {/* Description snippet */}
        <p style={{
          fontSize: '0.86rem',
          color: 'var(--text-secondary)',
          lineHeight: 1.5,
          marginBottom: '0.75rem',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden'
        }}>
          {complaint.description}
        </p>

        {/* Attached Photo Thumbnail (if provided) */}
        {complaint.image_url && (
          <div style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.6rem', background: 'rgba(15, 23, 42, 0.6)', padding: '0.4rem 0.6rem', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
            <img
              src={complaint.image_url}
              alt="Complaint Attached Site Photo"
              style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '6px', border: '1px solid var(--glass-border)' }}
            />
            <div style={{ fontSize: '0.75rem', color: '#34d399', fontWeight: 600 }}>
              📷 Site Photo Attached
            </div>
          </div>
        )}

        {/* Category & Location Badges */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', marginBottom: '1rem', fontSize: '0.78rem' }}>
          <span style={{
            background: 'rgba(59, 130, 246, 0.1)',
            border: '1px solid rgba(59, 130, 246, 0.25)',
            color: '#93c5fd',
            padding: '0.2rem 0.6rem',
            borderRadius: '12px',
            fontWeight: 600,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.3rem'
          }}>
            <Tag size={12} /> {categoryLabel}
          </span>

          {complaint.department && (
            <span style={{
              background: 'rgba(167, 139, 250, 0.1)',
              border: '1px solid rgba(167, 139, 250, 0.25)',
              color: '#c084fc',
              padding: '0.2rem 0.6rem',
              borderRadius: '12px',
              fontWeight: 600
            }}>
              🏛️ {complaint.department}
            </span>
          )}

          {complaint.detected_language && (
            <span style={{
              background: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: '#34d399',
              padding: '0.2rem 0.6rem',
              borderRadius: '12px',
              fontWeight: 600
            }}>
              🌐 {complaint.detected_language}
            </span>
          )}
        </div>
      </div>

      {/* Card Footer: Date, Location & Action Link */}
      <div style={{ paddingTop: '0.85rem', borderTop: '1px solid var(--glass-border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            <MapPin size={13} style={{ color: 'var(--primary)', flexShrink: 0 }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{complaint.address || 'Location Specified'}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', flexShrink: 0 }}>
            <Calendar size={13} /> {dateFormatted}
          </div>
        </div>

        <Link
          to={`/complaint/${complaint.id}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.4rem',
            width: '100%',
            padding: '0.55rem',
            borderRadius: '10px',
            background: 'rgba(59, 130, 246, 0.12)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            color: '#60a5fa',
            fontSize: '0.83rem',
            fontWeight: 700,
            textDecoration: 'none',
            transition: 'all 0.2s ease'
          }}
        >
          {t('btn.trackDetails', 'Track Complaint Details')} <ArrowRight size={14} />
        </Link>
      </div>
    </Card>
  );
};
