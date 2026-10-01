import React from 'react';
import { Shield, Mail, AlertCircle, HelpCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Footer = () => {
  return (
    <footer style={{
      background: 'rgba(10, 14, 26, 0.95)',
      borderTop: '1px solid var(--glass-border)',
      padding: '3rem 2rem 2rem 2rem',
      marginTop: 'auto',
      color: 'var(--text-secondary)'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '2.5rem',
        marginBottom: '2.5rem'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fff', fontWeight: 800, fontSize: '1.2rem', marginBottom: '0.75rem' }}>
            <Shield size={22} style={{ color: 'var(--primary)' }} /> JanSahayak AI
          </div>
          <p style={{ fontSize: '0.85rem', lineHeight: 1.6, color: 'var(--text-muted)' }}>
            AI-Powered Citizen Grievance Platform. Prototype for intelligent public service delivery and SLA monitoring.
          </p>
        </div>

        <div>
          <h4 style={{ color: '#fff', fontSize: '0.95rem', fontWeight: 700, marginBottom: '1rem' }}>Quick Links</h4>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
            <li><Link to="/" style={footerLink}>Home & Overview</Link></li>
            <li><Link to="/create-complaint" style={footerLink}>File Grievance</Link></li>
            <li><Link to="/track" style={footerLink}>Track Grievance Status</Link></li>
            <li><Link to="/ask-ai" style={footerLink}>Ask JanSahayak Virtual Assistant</Link></li>
          </ul>
        </div>

        <div>
          <h4 style={{ color: '#fff', fontSize: '0.95rem', fontWeight: 700, marginBottom: '1rem' }}>Platform Support</h4>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.85rem' }}>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Mail size={14} style={{ color: 'var(--accent)' }} /> support@jansahayak-ai.org
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <HelpCircle size={14} style={{ color: 'var(--emerald)' }} /> 24x7 AI Grievance Assistant Active
            </li>
          </ul>
        </div>

        <div>
          <h4 style={{ color: '#fff', fontSize: '0.95rem', fontWeight: 700, marginBottom: '1rem' }}>System Status</h4>
          <p style={{ fontSize: '0.8rem', lineHeight: 1.5, color: '#fbbf24', display: 'flex', alignItems: 'flex-start', gap: '0.4rem' }}>
            <AlertCircle size={15} style={{ flexShrink: 0, marginTop: '2px' }} />
            Government portal integration: Not connected (Prototype System)
          </p>
        </div>
      </div>

      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        paddingTop: '1.5rem',
        borderTop: '1px solid rgba(255, 255, 255, 0.05)',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '0.8rem',
        color: 'var(--text-muted)'
      }}>
        <div>© 2026 JanSahayak AI. AI-Powered Citizen Grievance Platform (Prototype).</div>
        <div style={{ display: 'flex', gap: '1.5rem' }}>
          <span>Privacy Policy</span>
          <span>Terms of Service</span>
          <span>Accessibility</span>
        </div>
      </div>
    </footer>
  );
};

const footerLink = {
  color: 'var(--text-secondary)',
  textDecoration: 'none',
  transition: 'color 0.2s'
};
