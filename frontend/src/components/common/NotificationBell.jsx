import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { notificationService } from '../../services/notificationService';
import { useLanguage } from '../../context/LanguageContext';
import { 
  Bell, Check, CheckCheck, Clock, ShieldAlert, Cpu, UserCheck, 
  HelpCircle, AlertTriangle, ArrowRight, ExternalLink
} from 'lucide-react';

export const NotificationBell = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      const data = await notificationService.getNotifications();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unread_count || 0);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll for notifications every 30s
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (e, notif) => {
    e.stopPropagation();
    try {
      await notificationService.markAsRead(notif.id);
      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all read:', err);
    }
  };

  const handleItemClick = (notif) => {
    if (!notif.is_read) {
      notificationService.markAsRead(notif.id);
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
    setDropdownOpen(false);
    if (notif.complaint_id) {
      navigate(`/complaint/${notif.complaint_id}`);
    } else {
      navigate('/notifications');
    }
  };

  const getNotifIcon = (type) => {
    switch (type) {
      case 'SUBMITTED':
        return <Clock size={16} style={{ color: '#60a5fa' }} />;
      case 'AI_ANALYZED':
        return <Cpu size={16} style={{ color: '#c084fc' }} />;
      case 'ASSIGNED':
        return <UserCheck size={16} style={{ color: '#38bdf8' }} />;
      case 'RESOLVED':
        return <Check size={16} style={{ color: '#34d399' }} />;
      case 'ESCALATED':
        return <AlertTriangle size={16} style={{ color: '#f43f5e' }} />;
      case 'INFO_REQUEST':
        return <HelpCircle size={16} style={{ color: '#fbbf24' }} />;
      default:
        return <Bell size={16} style={{ color: '#94a3b8' }} />;
    }
  };

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      {/* Bell Icon Trigger */}
      <button
        type="button"
        onClick={() => setDropdownOpen(!dropdownOpen)}
        style={{
          position: 'relative',
          padding: '0.5rem',
          borderRadius: '10px',
          background: dropdownOpen ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255, 255, 255, 0.05)',
          border: '1px solid var(--glass-border)',
          color: dropdownOpen ? '#60a5fa' : 'var(--text-secondary)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s ease'
        }}
        aria-label="Notifications"
      >
        <Bell size={19} />
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '-4px',
            right: '-4px',
            background: '#f43f5e',
            color: '#fff',
            fontSize: '0.68rem',
            fontWeight: 800,
            width: '18px',
            height: '18px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 8px rgba(244, 63, 94, 0.6)'
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Dropdown Panel */}
      {dropdownOpen && (
        <div style={{
          position: 'absolute',
          right: 0,
          top: 'calc(100% + 8px)',
          width: '360px',
          maxWidth: '90vw',
          background: 'rgba(15, 23, 42, 0.98)',
          backdropFilter: 'blur(20px)',
          border: '1px solid var(--glass-border)',
          borderRadius: '16px',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
          zIndex: 1100,
          overflow: 'hidden'
        }}>
          {/* Dropdown Header */}
          <div style={{
            padding: '0.85rem 1.15rem',
            borderBottom: '1px solid var(--glass-border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'rgba(18, 24, 41, 0.8)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.92rem', fontWeight: 800, color: '#fff' }}>
                {language === 'hi' ? 'अधिसूचनाएं' : 'Notifications'}
              </span>
              {unreadCount > 0 && (
                <span style={{
                  background: 'rgba(244, 63, 94, 0.2)',
                  color: '#f43f5e',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  padding: '0.15rem 0.5rem',
                  borderRadius: '10px'
                }}>
                  {unreadCount} {language === 'hi' ? 'अपठित' : 'unread'}
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#60a5fa',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.2rem'
                }}
              >
                <CheckCheck size={14} /> {language === 'hi' ? 'सभी को पढ़ा हुआ चिन्हित करें' : 'Mark all read'}
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div style={{ maxHeight: '380px', overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                {language === 'hi' ? 'कोई नई सूचना उपलब्ध नहीं है' : 'No notifications yet'}
              </div>
            ) : (
              notifications.slice(0, 5).map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleItemClick(notif)}
                  style={{
                    padding: '0.85rem 1.15rem',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                    background: notif.is_read ? 'transparent' : 'rgba(59, 130, 246, 0.06)',
                    cursor: 'pointer',
                    display: 'flex',
                    gap: '0.75rem',
                    transition: 'background 0.2s ease'
                  }}
                >
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: 'rgba(18, 24, 41, 0.8)',
                    border: '1px solid var(--glass-border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {getNotifIcon(notif.notification_type)}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.25rem' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: notif.is_read ? 600 : 800, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' }}>
                        {notif.title}
                      </span>
                      {!notif.is_read && (
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3b82f6', flexShrink: 0, marginTop: '4px' }} />
                      )}
                    </div>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {notif.message}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Dropdown Footer */}
          <div style={{
            padding: '0.65rem 1.15rem',
            borderTop: '1px solid var(--glass-border)',
            background: 'rgba(10, 14, 26, 0.8)',
            textAlign: 'center'
          }}>
            <Link
              to="/notifications"
              onClick={() => setDropdownOpen(false)}
              style={{
                fontSize: '0.82rem',
                fontWeight: 700,
                color: '#60a5fa',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}
            >
              {language === 'hi' ? 'सभी सूचनाएं देखें' : 'View All Notifications'} <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};
