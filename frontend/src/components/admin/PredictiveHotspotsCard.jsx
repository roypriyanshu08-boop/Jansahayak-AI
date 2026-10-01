import React from 'react';
import { Card, Button } from '../common/CommonComponents';
import { 
  TrendingUp, AlertTriangle, ShieldAlert, Sparkles, 
  Building2, CheckCircle2, ArrowRight, Activity, HelpCircle
} from 'lucide-react';
import { ExplainableAI } from '../common/ExplainableAI';

export const PredictiveHotspotsCard = ({ predictiveData }) => {
  if (!predictiveData) return null;

  const hotspots = predictiveData.predictive_hotspots || [];
  const isDemo = predictiveData.is_demo_dataset;

  const getRiskBadge = (risk) => {
    const r = (risk || 'Medium').toLowerCase();
    if (r === 'high') {
      return { bg: 'rgba(239, 68, 68, 0.2)', border: 'rgba(239, 68, 68, 0.6)', text: '#fca5a5', label: 'HIGH RISK' };
    }
    if (r === 'medium') {
      return { bg: 'rgba(245, 158, 11, 0.2)', border: 'rgba(245, 158, 11, 0.6)', text: '#fcd34d', label: 'MEDIUM RISK' };
    }
    return { bg: 'rgba(52, 211, 153, 0.2)', border: 'rgba(52, 211, 153, 0.6)', text: '#6ee7b7', label: 'LOW RISK' };
  };

  return (
    <Card style={{ 
      marginBottom: '2rem', 
      border: '1px solid rgba(168, 85, 247, 0.4)',
      background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.08) 0%, rgba(15, 23, 42, 0.85) 100%)'
    }}>
      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem', borderBottom: '1px solid rgba(168, 85, 247, 0.2)', paddingBottom: '0.85rem' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#c084fc', background: 'rgba(168, 85, 247, 0.15)', border: '1px solid rgba(168, 85, 247, 0.4)', padding: '0.25rem 0.7rem', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 800, marginBottom: '0.4rem' }}>
            <Sparkles size={14} /> Predictive Public-Service Analytics (AI Estimate)
          </div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#fff' }}>
            Future Problem Hotspot Projections
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
            Historical complaint velocity, spatial ward clustering, and seasonal pattern forecasting
          </p>
        </div>

        {/* AI Safeguard Disclaimer Badge */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.4rem' }}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: '0.35rem 0.75rem',
            borderRadius: '8px',
            fontSize: '0.75rem',
            fontWeight: 800,
            background: 'rgba(59, 130, 246, 0.15)',
            border: '1px solid rgba(59, 130, 246, 0.4)',
            color: '#93c5fd'
          }}>
            <HelpCircle size={14} /> AI Generated Predictive Hypothesis (Non-Guaranteed)
          </span>

          {isDemo && (
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.3rem 0.65rem',
              borderRadius: '6px',
              fontSize: '0.75rem',
              fontWeight: 800,
              background: 'rgba(245, 158, 11, 0.2)',
              border: '1px solid rgba(245, 158, 11, 0.5)',
              color: '#fcd34d'
            }}>
              DEMO DATASET: Rule-Based Predictive Demonstration
            </span>
          )}
        </div>
      </div>

      {/* Grid of Predicted Area Hotspot Cards */}
      {hotspots.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-secondary)' }}>No predictive problem hotspots projected currently</div>
          <div style={{ fontSize: '0.85rem', marginTop: '0.3rem' }}>Data will appear here after citizens submit real complaints across different sectors.</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: '1.25rem' }}>
          {hotspots.map((item, idx) => {
            const badge = getRiskBadge(item.risk);
            return (
              <div key={idx} style={{
                padding: '1.1rem',
                borderRadius: '12px',
                background: 'rgba(10, 14, 26, 0.6)',
                border: `1px solid ${badge.border}`,
                display: 'flex',
                flexDirection: 'column',
                justify: 'space-between',
                boxShadow: '0 4px 14px rgba(0, 0, 0, 0.3)'
              }}>
                <div>
                  {/* Area & Risk Level Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#e9d5ff', fontWeight: 800, fontSize: '1.1rem' }}>
                      <Building2 size={18} color="#c084fc" /> Area: {item.area}
                    </div>
                    <span style={{
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      padding: '0.25rem 0.65rem',
                      borderRadius: '12px',
                      background: badge.bg,
                      color: badge.text,
                      border: `1px solid ${badge.border}`
                    }}>
                      Risk: {item.risk}
                    </span>
                  </div>

                  {/* Explainable AI Hotspot Reason Box */}
                  <ExplainableAI
                    type="priority"
                    title={`Area Predictive Risk: ${item.area}`}
                    value={`Risk: ${item.risk} (${item.issue})`}
                    reasons={[
                      `Primary Predicted Problem: ${item.issue}`,
                      `Historical Complaint Frequency: ${item.reason}`,
                      `Seasonal/Temporal Pattern: High surge risk detected during active period`,
                      `Recommended Action: ${item.recommended_prevention || 'Preemptive maintenance dispatch'}`
                    ]}
                    confidence={0.66}
                    needsHumanVerification={true}
                    verificationReason="AI Predictive Estimate. Requires human administrator validation before dispatching resources."
                    defaultExpanded={true}
                  />
                </div>

                {/* Recommended Action */}
                {item.recommended_prevention && (
                  <div style={{ paddingTop: '0.75rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                    <span style={{ fontSize: '0.72rem', color: '#38bdf8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.03em', display: 'block', marginBottom: '0.2rem' }}>
                      Recommended Preventive Action
                    </span>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                      {item.recommended_prevention}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
};
