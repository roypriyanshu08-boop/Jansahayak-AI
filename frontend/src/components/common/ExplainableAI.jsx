import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { 
  Sparkles, HelpCircle, ShieldAlert, CheckCircle2, ChevronDown, ChevronUp, 
  Info, AlertTriangle, Layers, Clock, Building2, Activity, Cpu, UserCheck
} from 'lucide-react';

/**
 * Reusable Explainable AI (XAI) Component.
 * Displays transparent "Why?" explanation factors and "Needs human verification" badges.
 * Supports Priority, Department, Duplicate Detection, Impact Score, Root Cause, and Resolution Time outputs.
 */
export const ExplainableAI = ({
  type, // "priority" | "department" | "duplicate" | "impact" | "root_cause" | "resolution"
  value, // e.g. "Critical", "Roads & Transport", "85/100", "Damaged Pipeline"
  reasons = [], // list of string explanations / bullet points
  confidence = 0.85,
  needsHumanVerification = false,
  verificationReason = null,
  title = null,
  collapsible = true,
  defaultExpanded = true,
  style = {}
}) => {
  const { t, language } = useLanguage();
  const [expanded, setExpanded] = useState(defaultExpanded);

  // Parse confidence
  const isLowConfidence = needsHumanVerification || (typeof confidence === 'number' && confidence < 0.70);
  const confidencePct = typeof confidence === 'number' ? `${Math.round(confidence * 100)}%` : '85%';

  // Determine Icon & Label based on output type
  const getTypeDetails = () => {
    switch (type) {
      case 'priority':
        return {
          label: t('form.priority', 'Urgency Priority'),
          icon: ShieldAlert,
          color: value === 'CRITICAL' || value === 'Critical' ? '#f43f5e' : value === 'HIGH' || value === 'High' ? '#fbbf24' : '#60a5fa',
          defaultWhy: language === 'hi'
            ? ["सार्वजनिक सुरक्षा जोखिम का पता चला", "संवेदनशील स्थल (स्कूल/अस्पताल) के समीप", "समीप में कई शिकायतें दर्ज", "उच्च गंभीरता विवरण"]
            : ["Safety risk detected in vicinity", "Located near sensitive landmark (School/Hospital)", "Multiple duplicate reports in locality", "High severity complaint description"]
        };
      case 'department':
        return {
          label: t('form.department', 'Assigned Department'),
          icon: Building2,
          color: '#c084fc',
          defaultWhy: language === 'hi'
            ? ["कम्यूटर विजन AI ने संबंधित बुनियादी ढांचे की पहचान की", "शिकायत पाठ विवरण से विभाग का मिलान", "क्षेत्राधिकार नियम लागू"]
            : ["Computer Vision AI identified matching infrastructure category", "NLP text matching against departmental keywords", "Municipal ward jurisdiction rule applied"]
        };
      case 'duplicate':
        return {
          label: t('dashboard.duplicateGroups', 'Duplicate Detection Cluster'),
          icon: Layers,
          color: '#38bdf8',
          defaultWhy: language === 'hi'
            ? ["500 मीटर के दायरे में समान शिकायतें", "समान श्रेणी और विषय वस्तु", "समय सीमा का मिलान"]
            : ["Geographic proximity within 500m radius", "High semantic text similarity match", "Cluster timestamp within same period"]
        };
      case 'impact':
        return {
          label: language === 'hi' ? "नागरिक प्रभाव स्कोर" : "Citizen Impact Score",
          icon: Activity,
          color: '#f59e0b',
          defaultWhy: language === 'hi'
            ? ["पैदल यात्री एवं वाहन आवागमन में बाधा", "समीपस्थ आबादी घनत्व प्रभाव", "पर्यावरणीय/स्वास्थ्य जोखिम कारक"]
            : ["Pedestrian & traffic flow obstruction", "High local population density near location", "Public health/sanitation hazard multiplier"]
        };
      case 'root_cause':
        return {
          label: language === 'hi' ? "AI मूल कारण परिकल्पना" : "AI Root Cause Hypothesis",
          icon: Cpu,
          color: '#a78bfa',
          defaultWhy: language === 'hi'
            ? ["स्थानीय पाइपलाइन/सड़क घिसाव का रुझान", "हाल ही में प्राप्त शिकायतों का क्लस्टर", "मौसमी रिसाव पैटर्न"]
            : ["Underground pipeline leak keyword frequency", "Spatial cluster density pattern in locality", "Seasonal water pressure leak history"]
        };
      case 'resolution':
        return {
          label: language === 'hi' ? "अनुमानित समाधान समय" : "Estimated Resolution Time",
          icon: Clock,
          color: '#34d399',
          defaultWhy: language === 'hi'
            ? ["श्रेणी का मानक बेंचमार्क समय", "प्राथमिकता के अनुसार समय सीमा में छूट", "वर्तमान अधिकारी कार्यभार समायोजन"]
            : ["Category turnaround benchmark hours", "Urgency priority expedite adjustment", "Current active officer queue workload"]
        };
      default:
        return {
          label: 'AI Output Analysis',
          icon: Sparkles,
          color: '#60a5fa',
          defaultWhy: ["Grounded application database analysis", "Multi-factor AI scoring algorithm"]
        };
    }
  };

  const info = getTypeDetails();
  const Icon = info.icon;
  const whyFactors = (reasons && reasons.length > 0) ? reasons : info.defaultWhy;

  return (
    <div style={{
      background: 'rgba(18, 24, 41, 0.75)',
      border: isLowConfidence ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid var(--glass-border)',
      borderRadius: '14px',
      padding: '1rem 1.15rem',
      marginTop: '0.75rem',
      marginBottom: '0.75rem',
      ...style
    }}>
      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{
            padding: '0.4rem',
            borderRadius: '8px',
            background: 'rgba(10, 14, 26, 0.8)',
            border: '1px solid var(--glass-border)',
            color: info.color
          }}>
            <Icon size={18} />
          </div>
          <div>
            <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {title || info.label}
            </div>
            <div style={{ fontSize: '1rem', fontWeight: 800, color: '#fff' }}>
              {value}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {/* Verification Badge */}
          {isLowConfidence ? (
            <span style={{
              background: 'rgba(245, 158, 11, 0.15)',
              border: '1px solid rgba(245, 158, 11, 0.35)',
              color: '#fbbf24',
              padding: '0.25rem 0.65rem',
              borderRadius: '16px',
              fontSize: '0.75rem',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}>
              <AlertTriangle size={13} /> {language === 'hi' ? 'मानवीय सत्यापन आवश्यक' : 'Needs human verification'}
            </span>
          ) : (
            <span style={{
              background: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: '#34d399',
              padding: '0.25rem 0.65rem',
              borderRadius: '16px',
              fontSize: '0.75rem',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}>
              <CheckCircle2 size={13} /> {language === 'hi' ? `AI सम्पुष्ट (${confidencePct})` : `AI Confirmed (${confidencePct})`}
            </span>
          )}

          {collapsible && (
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--glass-border)',
                color: 'var(--text-secondary)',
                padding: '0.3rem',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="Toggle Why? factors"
            >
              {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          )}
        </div>
      </div>

      {/* Expandable "Why?" Factors Panel */}
      {expanded && (
        <div style={{ marginTop: '0.85rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
          <div style={{
            fontSize: '0.8rem',
            fontWeight: 800,
            color: '#60a5fa',
            marginBottom: '0.4rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem'
          }}>
            <HelpCircle size={14} /> {language === 'hi' ? "क्यों? (Why? - AI विश्लेषण कारण):" : "Why? (Explainable AI Decision Factors):"}
          </div>

          <ul style={{
            margin: 0,
            paddingLeft: '1.25rem',
            fontSize: '0.86rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.6,
            listStyleType: 'disc'
          }}>
            {whyFactors.map((factor, idx) => (
              <li key={idx} style={{ marginBottom: '0.35rem' }}>
                <strong style={{ color: '#e0f2fe' }}>•</strong> {factor}
              </li>
            ))}
          </ul>

          {/* Low Confidence Warning detail if applicable */}
          {isLowConfidence && (
            <div style={{
              marginTop: '0.65rem',
              padding: '0.5rem 0.75rem',
              borderRadius: '8px',
              background: 'rgba(245, 158, 11, 0.08)',
              border: '1px dashed rgba(245, 158, 11, 0.3)',
              fontSize: '0.78rem',
              color: '#fbbf24',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}>
              <Info size={14} style={{ flexShrink: 0 }} />
              <div>
                <strong>{language === 'hi' ? 'मानवीय नियंत्रण नियम:' : 'Human Administrator Control:'}</strong> {verificationReason || (language === 'hi' ? 'यह परिणाम AI परिकल्पना है। अंतिम निर्णय अधिकारी द्वारा लिया जाएगा।' : 'AI confidence is below 70% threshold. Requires human officer verification.')}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
