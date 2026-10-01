import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { Globe, Check, ChevronDown } from 'lucide-react';

export const LanguageSwitcher = ({ style = {}, variant = 'compact' }) => {
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const options = [
    { code: 'en', label: 'English', subLabel: 'English' },
    { code: 'hi', label: 'हिंदी', subLabel: 'Hindi' },
    { code: 'hinglish', label: 'Hinglish', subLabel: 'Hindi-English Mix' }
  ];

  const currentOption = options.find(o => o.code === language) || options[0];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard accessibility
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    } else if (e.key === 'Enter' || e.key === ' ') {
      if (!isOpen) {
        e.preventDefault();
        setIsOpen(true);
      }
    }
  };

  const handleSelectLanguage = (code) => {
    setLanguage(code);
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} style={{ position: 'relative', display: 'inline-block', ...style }}>
      {/* Language Trigger Button - Opens Selector Popover Only (Does NOT immediately change language) */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        style={{
          background: 'rgba(59, 130, 246, 0.12)',
          border: '1px solid rgba(59, 130, 246, 0.35)',
          color: '#60a5fa',
          padding: variant === 'pill' ? '0.35rem 0.85rem' : '0.45rem 0.95rem',
          borderRadius: '10px',
          fontSize: '0.82rem',
          fontWeight: 700,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '0.45rem',
          transition: 'all 0.2s ease',
          outline: 'none',
          boxShadow: isOpen ? '0 0 0 2px rgba(59, 130, 246, 0.4)' : 'none'
        }}
      >
        <Globe size={16} />
        <span>🌐 {currentOption.label}</span>
        <ChevronDown size={14} style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }} />
      </button>

      {/* Language Selection Dropdown / Popover Modal */}
      {isOpen && (
        <div
          role="listbox"
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            width: '230px',
            background: '#0f172a',
            border: '1px solid var(--glass-border)',
            borderRadius: '14px',
            padding: '0.6rem',
            boxShadow: '0 12px 32px rgba(0, 0, 0, 0.6)',
            zIndex: 9999,
            animation: 'fadeIn 0.15s ease-out'
          }}
        >
          {/* Header */}
          <div style={{
            fontSize: '0.78rem',
            fontWeight: 800,
            color: 'var(--text-muted)',
            padding: '0.4rem 0.6rem 0.6rem 0.6rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem'
          }}>
            <Globe size={14} /> 🌐 Select Language / भाषा चुनें
          </div>

          {/* Options List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', padding: '0.5rem 0' }}>
            {options.map((opt) => {
              const isSelected = language === opt.code;
              return (
                <button
                  key={opt.code}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelectLanguage(opt.code)}
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.75rem',
                    borderRadius: '8px',
                    background: isSelected ? 'rgba(59, 130, 246, 0.18)' : 'transparent',
                    border: isSelected ? '1px solid rgba(59, 130, 246, 0.35)' : '1px solid transparent',
                    color: isSelected ? '#fff' : 'var(--text-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    fontSize: '0.88rem',
                    fontWeight: isSelected ? 700 : 500,
                    textAlign: 'left',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <div style={{
                      width: '16px',
                      height: '16px',
                      borderRadius: '50%',
                      border: isSelected ? '5px solid #3b82f6' : '2px solid var(--text-muted)',
                      boxSizing: 'border-box'
                    }} />
                    <div>
                      <span style={{ display: 'block', lineHeight: 1.2 }}>{opt.label}</span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>{opt.subLabel}</span>
                    </div>
                  </div>

                  {isSelected && (
                    <Check size={16} style={{ color: '#60a5fa' }} />
                  )}
                </button>
              );
            })}
          </div>

          {/* Footer showing currently selected */}
          <div style={{
            padding: '0.5rem 0.6rem 0.2rem 0.6rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            fontSize: '0.75rem',
            color: '#34d399',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '0.3rem'
          }}>
            <Check size={13} /> Currently selected: {currentOption.label}
          </div>
        </div>
      )}
    </div>
  );
};
