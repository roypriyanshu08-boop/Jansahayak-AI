import React, { useState, useEffect, useRef } from 'react';
import { Card, Button, Badge } from '../../components/common/CommonComponents';
import { useLanguage } from '../../context/LanguageContext';
import { LanguageSwitcher } from '../../components/common/LanguageSwitcher';
import { 
  MessageSquare, Send, Bot, User, Sparkles, HelpCircle, 
  Mic, MicOff, Globe, ShieldCheck, AlertCircle, Clock, CheckCircle2, 
  ArrowRight, FileText, ChevronRight
} from 'lucide-react';
import { aiService } from '../../services/aiService';

export const AskJanSahayak = () => {
  const { language, setLanguage, t } = useLanguage();
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);
  const chatEndRef = useRef(null);

  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      text: language === 'hi'
        ? "नमस्ते! मैं आपका जनसहायक AI वर्चुअल सहायक हूँ। मैं आपके पंजीकृत शिकायतों, नगर निगम सेवाओं, या जन सेवा नियमों से संबंधित प्रश्नों का उत्तर दे सकता हूँ।"
        : "Namaste! I am your JanSahayak AI Virtual Assistant. Ask me about your complaint status, reporting civic issues, SLA resolution timelines, or municipal department responsibilities.",
      grounded: true,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const quickPrompts = [
    {
      en: "What is the status of my complaint?",
      hi: "मेरी शिकायत की स्थिति क्या है?"
    },
    {
      en: "How do I report a pothole?",
      hi: "सड़क के गड्ढे की शिकायत कैसे करें?"
    },
    {
      en: "Which department handles garbage?",
      hi: "कचरा प्रबंधन कौन सा विभाग संभालता है?"
    },
    {
      en: "My complaint has not been resolved.",
      hi: "मेरी शिकायत का समाधान नहीं हुआ है।"
    },
    {
      en: "What should I do if my complaint is delayed?",
      hi: "यदि शिकायत में देरी हो तो क्या करना चाहिए?"
    }
  ];

  // Update initial welcome message if language switches
  useEffect(() => {
    setMessages(prev => {
      if (prev.length === 1 && prev[0].id === 1) {
        return [{
          id: 1,
          sender: 'bot',
          text: language === 'hi'
            ? "नमस्ते! मैं आपका जनसहायक AI वर्चुअल सहायक हूँ। मैं आपके पंजीकृत शिकायतों, नगर निगम सेवाओं, या जन सेवा नियमों से संबंधित प्रश्नों का उत्तर दे सकता हूँ।"
            : "Namaste! I am your JanSahayak AI Virtual Assistant. Ask me about your complaint status, reporting civic issues, SLA resolution timelines, or municipal department responsibilities.",
          grounded: true,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }];
      }
      return prev;
    });
  }, [language]);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  // Setup Web Speech API Voice Input
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = language === 'hi' ? 'hi-IN' : 'en-US';

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
      };

      recognition.onerror = (event) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, [language]);

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser. Please use Google Chrome, Edge, or Safari.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.lang = language === 'hi' ? 'hi-IN' : 'en-US';
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error('Mic start error:', err);
        setIsListening(false);
      }
    }
  };

  const handleSend = async (queryText) => {
    const textToSend = queryText || input;
    if (!textToSend.trim()) return;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!queryText) setInput('');
    setTyping(true);

    try {
      const response = await aiService.askAssistant(textToSend, language);
      
      const botMsg = {
        id: Date.now() + 1,
        sender: 'bot',
        text: response.answer || (language === 'hi' ? "क्षमा करें, मुझे इस प्रश्न का सटीक उत्तर नहीं मिल सका।" : "I apologize, but I could not find verified details for your inquiry."),
        grounded: response.grounded_in_db !== false,
        intent: response.intent,
        user_complaints: response.user_complaints || [],
        actions: response.actions || [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      console.error('JanSahayak AI error:', err);
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: 'bot',
        text: language === 'hi' 
          ? "सर्वर में अस्थायी रुकावट है। कृपया पुनः प्रयास करें या सीधे 'My Complaints' में स्थिति देखें।" 
          : "There is a temporary connection issue. Please retry or view direct complaint status under 'My Complaints'.",
        grounded: false,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } finally {
      setTyping(false);
    }
  };

  return (
    <div className="main-content" style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '3rem' }}>
      {/* Header Banner */}
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: '0.6rem', 
          color: '#c084fc', 
          background: 'rgba(139, 92, 246, 0.1)', 
          border: '1px solid rgba(139, 92, 246, 0.3)', 
          padding: '0.4rem 1.25rem', 
          borderRadius: '20px', 
          fontSize: '0.85rem', 
          fontWeight: 700, 
          marginBottom: '0.85rem' 
        }}>
          <Sparkles size={16} /> {t('nav.askJanSahayak', 'Ask JanSahayak AI Assistant')}
        </div>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 800, margin: 0 }}>
          {language === 'hi' ? 'जनसहायक' : 'Ask JanSahayak'} <span className="gradient-text">AI</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.4rem', fontSize: '0.95rem' }}>
          {language === 'hi' 
            ? 'वास्तविक शिकायत ट्रैकिंग, स्थिति सत्यापन एवं सार्वजनिक सेवा मार्गदर्शन'
            : 'Real-time grievance tracking, complaint status verification, & municipal guidance'
          }
        </p>

        {/* Control Bar: Language & Security badge */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '1.25rem' }}>
          <LanguageSwitcher variant="pill" />

          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            color: '#10b981',
            padding: '0.35rem 0.85rem',
            borderRadius: '12px',
            fontSize: '0.78rem',
            fontWeight: 600
          }}>
            <ShieldCheck size={14} /> {language === 'hi' ? 'डेटाबेस सत्यापित उत्तर' : 'Grounded Database Answers'}
          </div>
        </div>
      </div>

      {/* Suggested Quick Prompts Grid */}
      <div style={{ marginBottom: '1.25rem' }}>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <HelpCircle size={14} /> {language === 'hi' ? 'अनुशंसित प्रश्न:' : 'Recommended Citizen Questions:'}
        </p>
        <div style={{ display: 'flex', gap: '0.6rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
          {quickPrompts.map((item, idx) => {
            const promptText = language === 'hi' ? item.hi : item.en;
            return (
              <button
                key={idx}
                onClick={() => handleSend(promptText)}
                style={{
                  background: 'rgba(59, 130, 246, 0.08)',
                  border: '1px solid rgba(59, 130, 246, 0.25)',
                  color: '#60a5fa',
                  padding: '0.5rem 0.95rem',
                  borderRadius: '20px',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
              >
                💬 {promptText}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Chat Interface Card */}
      <Card style={{ height: '580px', display: 'flex', flexDirection: 'column', padding: '1.25rem', position: 'relative' }}>
        {/* Messages Stream */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem', paddingRight: '0.5rem' }}>
          {messages.map((msg) => (
            <div
              key={msg.id}
              style={{
                display: 'flex',
                gap: '0.85rem',
                alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '85%'
              }}
            >
              {msg.sender === 'bot' && (
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '12px',
                  background: 'var(--accent-gradient)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  flexShrink: 0,
                  boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)'
                }}>
                  <Bot size={20} />
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%' }}>
                <div style={{
                  background: msg.sender === 'user' ? 'var(--primary-gradient)' : 'rgba(18, 24, 41, 0.85)',
                  border: msg.sender === 'user' ? 'none' : '1px solid var(--glass-border)',
                  color: '#fff',
                  padding: '1rem 1.25rem',
                  borderRadius: msg.sender === 'user' ? '18px 18px 2px 18px' : '18px 18px 18px 2px',
                  fontSize: '0.92rem',
                  lineHeight: 1.6,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
                }}>
                  <div style={{ whiteSpace: 'pre-line' }}>{msg.text}</div>

                  {/* Render User Complaint Cards if retrieved by AI */}
                  {msg.user_complaints && msg.user_complaints.length > 0 && (
                    <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <p style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        📋 {language === 'hi' ? 'आपकी पंजीकृत शिकायतें:' : 'Your Registered Complaint Records:'}
                      </p>
                      {msg.user_complaints.map((c) => (
                        <div
                          key={c.id}
                          style={{
                            background: 'rgba(10, 14, 26, 0.8)',
                            border: '1px solid var(--glass-border)',
                            borderRadius: '12px',
                            padding: '0.85rem',
                            fontSize: '0.85rem'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                            <span style={{ fontWeight: 800, color: '#60a5fa' }}>{c.id}</span>
                            <Badge status={c.status} />
                          </div>
                          <div style={{ fontWeight: 700, color: '#fff', marginBottom: '0.3rem' }}>{c.title}</div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                            <span>🏛️ {t('form.department', 'Dept')}: <strong>{c.department || 'Municipal'}</strong></span>
                            <span>📍 {t('form.priority', 'Priority')}: <strong>{c.priority}</strong></span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Render Quick Action Chips */}
                  {msg.actions && msg.actions.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.85rem' }}>
                      {msg.actions.map((act, aIdx) => (
                        <span
                          key={aIdx}
                          style={{
                            background: 'rgba(255, 255, 255, 0.08)',
                            border: '1px solid rgba(255, 255, 255, 0.15)',
                            padding: '0.25rem 0.65rem',
                            borderRadius: '12px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            color: '#93c5fd'
                          }}
                        >
                          👉 {act}
                        </span>
                      ))}
                    </div>
                  )}

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginTop: '0.6rem',
                    fontSize: '0.72rem',
                    color: msg.sender === 'user' ? 'rgba(255,255,255,0.7)' : 'var(--text-muted)'
                  }}>
                    <span>{msg.timestamp}</span>
                    {msg.sender === 'bot' && (
                      <span style={{ color: msg.grounded ? '#34d399' : '#fbbf24', fontWeight: 600 }}>
                        {msg.grounded 
                          ? (language === 'hi' ? '✓ डेटाबेस सत्यापित' : '✓ Grounded in DB')
                          : (language === 'hi' ? 'ℹ️ सामान्य निर्देश' : 'ℹ️ General Guide')
                        }
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {msg.sender === 'user' && (
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '12px',
                  background: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  flexShrink: 0
                }}>
                  <User size={20} />
                </div>
              )}
            </div>
          ))}

          {typing && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--text-muted)', fontSize: '0.88rem', paddingLeft: '0.5rem' }}>
              <div style={{
                width: '30px', height: '30px', borderRadius: '8px', background: 'var(--accent-gradient)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff'
              }}>
                <Bot size={16} />
              </div>
              <span>{language === 'hi' ? 'जनसहायक AI डेटाबेस से जांच कर रहा है...' : 'JanSahayak AI is fetching verified database records...'}</span>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input Form with Voice Support */}
        <form
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          style={{
            display: 'flex',
            gap: '0.75rem',
            marginTop: '1rem',
            paddingTop: '1rem',
            borderTop: '1px solid var(--glass-border)',
            alignItems: 'center'
          }}
        >
          {/* Voice Input Mic Button */}
          <button
            type="button"
            onClick={toggleVoiceInput}
            title={isListening ? "Listening... Click to stop" : "Click to use Voice Input"}
            style={{
              padding: '0.75rem',
              borderRadius: '12px',
              background: isListening ? 'rgba(244, 63, 94, 0.25)' : 'rgba(18, 24, 41, 0.8)',
              border: isListening ? '1px solid #f43f5e' : '1px solid var(--glass-border)',
              color: isListening ? '#f43f5e' : 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease'
            }}
          >
            {isListening ? <MicOff size={20} style={{ animation: 'pulse 1s infinite' }} /> : <Mic size={20} />}
          </button>

          <input
            type="text"
            placeholder={
              isListening
                ? (language === 'hi' ? "बोलिए... आपकी आवाज़ सुनी जा रही है..." : "Listening... speak your question...")
                : (language === 'hi' ? "अपनी शिकायत या प्रश्न यहाँ लिखें..." : "Ask JanSahayak AI about complaints, SLA, or departments...")
            }
            value={input}
            onChange={(e) => setInput(e.target.value)}
            style={{
              flex: 1,
              padding: '0.85rem 1.15rem',
              background: 'rgba(10, 14, 26, 0.7)',
              border: isListening ? '1px solid #f43f5e' : '1px solid var(--glass-border)',
              borderRadius: '12px',
              color: 'var(--text-primary)',
              fontSize: '0.92rem',
              outline: 'none'
            }}
          />

          <Button type="submit" disabled={!input.trim() || typing}>
            <Send size={18} /> {language === 'hi' ? 'पूछें' : 'Ask'}
          </Button>
        </form>
      </Card>

      {/* Safety & Grounding Disclaimer */}
      <div style={{
        marginTop: '1.25rem',
        padding: '0.85rem 1.25rem',
        background: 'rgba(18, 24, 41, 0.5)',
        border: '1px solid var(--glass-border)',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        fontSize: '0.8rem',
        color: 'var(--text-muted)'
      }}>
        <AlertCircle size={18} style={{ color: '#60a5fa', flexShrink: 0 }} />
        <div>
          <strong>{language === 'hi' ? 'गोपनीयता एवं सत्यता गारंटी:' : 'Privacy & Accuracy Guarantee:'}</strong> {t('msg.privacyNotice', 'JanSahayak AI only accesses your own authenticated grievance data. Complaint statuses are strictly grounded in municipal backend records and are never invented.')}
        </div>
      </div>
    </div>
  );
};
