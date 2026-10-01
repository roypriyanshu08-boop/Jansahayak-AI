import React from 'react';
import { Link } from 'react-router-dom';
import { Card, Button } from '../components/common/CommonComponents';
import { Shield, PlusCircle, Search, Cpu, CheckCircle2, ArrowRight, Zap, Users, BarChart3, AlertTriangle } from 'lucide-react';
import { MOCK_COMPLAINTS } from '../services/mockData';

export const Landing = () => {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Official Hero Section */}
      <section style={{
        padding: '4.5rem 1.5rem 3.5rem 1.5rem',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Glow backdrop */}
        <div style={{
          position: 'absolute',
          top: '-120px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '700px',
          height: '700px',
          background: 'radial-gradient(circle, rgba(59, 130, 246, 0.18) 0%, rgba(139, 92, 246, 0.08) 45%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 0
        }} />

        <div style={{ maxWidth: '950px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          {/* Government Badge Banner */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.55rem',
            padding: '0.45rem 1.15rem',
            background: 'rgba(59, 130, 246, 0.12)',
            border: '1px solid rgba(59, 130, 246, 0.35)',
            borderRadius: '24px',
            color: '#60a5fa',
            fontSize: '0.85rem',
            fontWeight: 700,
            marginBottom: '1.75rem',
            boxShadow: '0 4px 14px rgba(59, 130, 246, 0.2)'
          }}>
            <span>🇮🇳</span>
            <Zap size={15} />
            <span>Digital India • JanSahayak AI Grievance Platform 2.0</span>
          </div>

          <h1 style={{ fontSize: '3.4rem', fontWeight: 800, lineHeight: 1.12, marginBottom: '1.35rem', letterSpacing: '-0.03em', color: '#fff' }}>
            Intelligent Public Grievance <br />
            <span className="gradient-text">Redressal for Every Citizen</span>
          </h1>

          <p style={{ fontSize: '1.18rem', color: 'var(--text-secondary)', lineHeight: 1.65, maxWidth: '750px', margin: '0 auto 2.5rem auto' }}>
            Empowering citizens with Voice Dictation in Hindi & English, automated AI priority scoring, duplicate grievance clustering, transparent XAI decision rationale, and smart field officer dispatch.
          </p>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/create-complaint?mode=voice" style={{ textDecoration: 'none' }}>
              <Button style={{ padding: '0.9rem 1.85rem', fontSize: '1rem', boxShadow: '0 4px 20px rgba(59, 130, 246, 0.4)' }}>
                <PlusCircle size={20} /> File a Civic Grievance
              </Button>
            </Link>
            <Link to="/track" style={{ textDecoration: 'none' }}>
              <Button variant="secondary" style={{ padding: '0.9rem 1.85rem', fontSize: '1rem' }}>
                <Search size={20} /> Track Existing Grievance
              </Button>
            </Link>
            <Link to="/ask-ai" style={{ textDecoration: 'none' }}>
              <Button variant="accent" style={{ padding: '0.9rem 1.85rem', fontSize: '1rem' }}>
                <Cpu size={20} /> Ask JanSahayak AI
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Quick Public-Service Performance Metrics */}
      <section style={{ padding: '0 1.5rem 3rem 1.5rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
          <Card style={{ textAlign: 'center', padding: '1.6rem 1.25rem', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
            <h2 style={{ fontSize: '2.4rem', fontWeight: 800, color: '#60a5fa' }}>98.4%</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 700, marginTop: '0.2rem' }}>AI Severity Triage Accuracy</p>
          </Card>
          <Card style={{ textAlign: 'center', padding: '1.6rem 1.25rem', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
            <h2 style={{ fontSize: '2.4rem', fontWeight: 800, color: '#34d399' }}>&lt; 24 Hours</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 700, marginTop: '0.2rem' }}>Average Officer Dispatch SLA</p>
          </Card>
          <Card style={{ textAlign: 'center', padding: '1.6rem 1.25rem', border: '1px solid rgba(168, 85, 247, 0.3)' }}>
            <h2 style={{ fontSize: '2.4rem', fontWeight: 800, color: '#c084fc' }}>100%</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 700, marginTop: '0.2rem' }}>Explainable AI (XAI) Rationale</p>
          </Card>
          <Card style={{ textAlign: 'center', padding: '1.6rem 1.25rem', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
            <h2 style={{ fontSize: '2.4rem', fontWeight: 800, color: '#fbbf24' }}>Zero</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 700, marginTop: '0.2rem' }}>Automated AI Rejection Policy</p>
          </Card>
        </div>
      </section>

      {/* Core Platform Pillars */}
      <section style={{ padding: '3.5rem 1.5rem', background: 'rgba(15, 23, 42, 0.6)', borderTop: '1px solid var(--glass-border)', borderBottom: '1px solid var(--glass-border)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#c084fc', background: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.3)', padding: '0.3rem 0.8rem', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              <Shield size={14} /> Official Public Service Workflow
            </div>
            <h2 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#fff' }}>How JanSahayak AI Operates</h2>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.4rem', fontSize: '0.95rem' }}>
              From citizen dictation to field officer resolution in three transparent steps
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.75rem' }}>
            <Card style={{ border: '1px solid rgba(59, 130, 246, 0.3)' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--primary-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', marginBottom: '1.1rem', boxShadow: '0 4px 14px rgba(59, 130, 246, 0.4)' }}>
                <PlusCircle size={24} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', marginBottom: '0.5rem' }}>1. Voice & Form Grievance Filing</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                Dictate issues naturally in Hindi or English, upload site photographs for Vision AI analysis, or submit exact GPS coordinates.
              </p>
            </Card>

            <Card style={{ border: '1px solid rgba(168, 85, 247, 0.3)' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', marginBottom: '1.1rem', boxShadow: '0 4px 14px rgba(139, 92, 246, 0.4)' }}>
                <Cpu size={24} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', marginBottom: '0.5rem' }}>2. AI Triage & Vector Clustering</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                Automated priority scoring, duplicate issue clustering, spatial impact calculation, and Explainable AI decision factor logs.
              </p>
            </Card>

            <Card style={{ border: '1px solid rgba(16, 185, 129, 0.3)' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--emerald-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', marginBottom: '1.1rem', boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)' }}>
                <CheckCircle2 size={24} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', marginBottom: '0.5rem' }}>3. Field Dispatch & SLA Escalation</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                Smart workload-balanced field officer dispatch, live SLA countdown tracking, multi-tier escalation, and in-app notifications.
              </p>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
};
