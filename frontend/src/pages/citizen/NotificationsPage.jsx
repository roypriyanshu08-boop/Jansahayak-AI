import React, { useState, useEffect } from 'react';
import { notificationService } from '../../services/notificationService';
import { Card, Button, LoadingSpinner, EmptyState } from '../../components/common/CommonComponents';
import { useLanguage } from '../../context/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, Check, CheckCheck, Clock, Cpu, UserCheck, 
  HelpCircle, AlertTriangle, ArrowRight, Filter, RefreshCw
} from 'lucide-react';

export const NotificationsPage = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL'); // ALL | UNREAD | STATUS | INFO | ESCALATED

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const data = await notificationService.getNotifications();
      setNotifications(data.notifications || []);
    } catch (err) {
      console.error('Failed to load notifications page:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  const filteredNotifs = notifications.filter(n => {
    if (filter === 'UNREAD') return !n.is_read;
    if (filter === 'STATUS') return n.notification_type === 'STATUS_CHANGE' || n.notification_type === 'RESOLVED';
    if (filter === 'INFO') return n.notification_type === 'INFO_REQUEST';
    if (filter === 'ESCALATED') return n.notification_type === 'ESCALATED';
    return true;
  });

  const getNotifIcon = (type) => {
    switch (type) {
      case 'SUBMITTED':
        return <Clock size={20} style={{ color: '#60a5fa' }} />;
      case 'AI_ANALYZED':
        return <Cpu size={20} style={{ color: '#c084fc' }} />;
      case 'ASSIGNED':
        return <UserCheck size={20} style={{ color: '#38bdf8' }} />;
      case 'RESOLVED':
        return <Check size={20} style={{ color: '#34d399' }} />;
      case 'ESCALATED':
        return <AlertTriangle size={20} style={{ color: '#f43f5e' }} />;
      case 'INFO_REQUEST':
        return <HelpCircle size={20} style={{ color: '#fbbf24' }} />;
      default:
        return <Bell size={20} style={{ color: '#94a3b8' }} />;
    }
  };

  return (
    <div className="main-content" style={{ maxWidth: '900px', margin: '0 auto', paddingBottom: '3rem' }}>
      {/* Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            color: '#c084fc',
            background: 'rgba(139, 92, 246, 0.1)',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            padding: '0.3rem 0.85rem',
            borderRadius: '20px',
            fontSize: '0.8rem',
            fontWeight: 700,
            marginBottom: '0.5rem'
          }}>
            <Bell size={14} /> {language === 'hi' ? "इन-ऐप अधिसूचना केंद्र" : "In-App Citizen Alert Center"}
          </div>
          <h1 style={{ fontSize: '2.1rem', fontWeight: 800, margin: 0 }}>
            {language === 'hi' ? 'नागरिक' : 'Citizen'} <span className="gradient-text">{language === 'hi' ? 'अधिसूचनाएं' : 'Notifications'}</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.35rem', fontSize: '0.95rem' }}>
            {language === 'hi'
              ? 'शिकायत दर्ज, AI विश्लेषण, अधिकारी आवंटन एवं एस्केलेशन अपडेट'
              : 'Real-time alert notifications for grievance submission, AI analysis, status changes, and officer requests'
            }
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={loadNotifications}
            style={{
              padding: '0.6rem 1rem',
              borderRadius: '10px',
              background: 'rgba(30, 41, 59, 0.8)',
              border: '1px solid var(--glass-border)',
              color: '#fff',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <RefreshCw size={15} /> {language === 'hi' ? 'रीफ्रेश' : 'Refresh'}
          </button>

          <button
            onClick={handleMarkAllRead}
            style={{
              padding: '0.6rem 1rem',
              borderRadius: '10px',
              background: 'rgba(59, 130, 246, 0.15)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              color: '#60a5fa',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <CheckCheck size={16} /> {language === 'hi' ? 'सभी को पढ़ा हुआ मार्क करें' : 'Mark All Read'}
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        overflowX: 'auto',
        paddingBottom: '0.5rem',
        marginBottom: '1.5rem',
        borderBottom: '1px solid var(--glass-border)'
      }}>
        {[
          { key: 'ALL', label: language === 'hi' ? 'सभी' : 'All Alerts' },
          { key: 'UNREAD', label: language === 'hi' ? 'अपठित' : 'Unread' },
          { key: 'STATUS', label: language === 'hi' ? 'स्थिति अपडेट' : 'Status Updates' },
          { key: 'INFO', label: language === 'hi' ? 'अधिकारी पूछताछ' : 'Officer Info Requests' },
          { key: 'ESCALATED', label: language === 'hi' ? 'एस्केलेशन' : 'Escalations' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '10px',
              border: filter === tab.key ? '1px solid rgba(59, 130, 246, 0.4)' : '1px solid transparent',
              background: filter === tab.key ? 'rgba(59, 130, 246, 0.18)' : 'transparent',
              color: filter === tab.key ? '#fff' : 'var(--text-secondary)',
              fontWeight: filter === tab.key ? 700 : 500,
              fontSize: '0.85rem',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notifications Stream */}
      {loading ? (
        <LoadingSpinner label={language === 'hi' ? "अधिसूचनाएं लोड हो रही हैं..." : "Loading notifications..."} />
      ) : filteredNotifs.length === 0 ? (
        <EmptyState
          title={language === 'hi' ? "कोई अधिसूचना नहीं मिली" : "No Notifications Found"}
          message={language === 'hi' ? "आपके चयन के अनुसार कोई अलर्ट संदेश उपलब्ध नहीं है।" : "There are no notifications matching your active filter criteria."}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filteredNotifs.map((notif) => (
            <Card
              key={notif.id}
              style={{
                padding: '1.15rem 1.35rem',
                background: notif.is_read ? 'rgba(18, 24, 41, 0.5)' : 'rgba(18, 24, 41, 0.85)',
                border: notif.is_read ? '1px solid var(--glass-border)' : '1px solid rgba(59, 130, 246, 0.35)',
                borderRadius: '16px',
                display: 'flex',
                gap: '1rem',
                alignItems: 'flex-start',
                position: 'relative'
              }}
            >
              {/* Type Icon Container */}
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'rgba(10, 14, 26, 0.8)',
                border: '1px solid var(--glass-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                {getNotifIcon(notif.notification_type)}
              </div>

              {/* Content Body */}
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: notif.is_read ? 700 : 800, color: '#fff', margin: 0 }}>
                      {notif.title}
                    </h3>
                    {notif.complaint_id && (
                      <span style={{
                        background: 'rgba(59, 130, 246, 0.15)',
                        color: '#60a5fa',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        padding: '0.15rem 0.5rem',
                        borderRadius: '10px'
                      }}>
                        #{notif.complaint_id.substring(0, 8)}
                      </span>
                    )}
                  </div>

                  <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                    {new Date(notif.created_at).toLocaleString()}
                  </span>
                </div>

                <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                  {notif.message}
                </p>

                {/* Bottom Card Controls */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.85rem', paddingTop: '0.65rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  {notif.complaint_id ? (
                    <button
                      onClick={() => navigate(`/complaint/${notif.complaint_id}`)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#60a5fa',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        padding: 0,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem'
                      }}
                    >
                      {language === 'hi' ? 'शिकायत ट्रैक करें' : 'View Grievance Details'} <ArrowRight size={14} />
                    </button>
                  ) : <div />}

                  {!notif.is_read && (
                    <button
                      onClick={() => handleMarkAsRead(notif.id)}
                      style={{
                        background: 'rgba(255, 255, 255, 0.08)',
                        border: '1px solid var(--glass-border)',
                        color: 'var(--text-muted)',
                        padding: '0.25rem 0.65rem',
                        borderRadius: '8px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem'
                      }}
                    >
                      <Check size={12} /> {language === 'hi' ? 'पढ़ा हुआ चिन्हित करें' : 'Mark as read'}
                    </button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
