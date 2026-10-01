import React, { createContext, useContext, useState, useEffect } from 'react';

export const translations = {
  en: {
    // Navigation & Portal Header
    nav: {
      portalTitle: "Government Civic Grievance & Intelligent Public Service Portal",
      emergencySupport: "Emergency Support: 1800-11-2026",
      systemOperational: "● System Operational",
      home: "Home",
      voiceComplaint: "Voice Complaint",
      submitForm: "Submit Form",
      myComplaints: "My Complaints",
      trackComplaint: "Track Complaint",
      askJanSahayak: "Ask JanSahayak AI",
      profile: "Profile",
      dashboard: "Dashboard",
      complaints: "Complaints",
      map: "Public Problem Map",
      analytics: "Predictive Analytics",
      officers: "Officer Workload",
      escalations: "SLA Escalations",
      aiInsights: "AI Root Cause Insights",
      login: "Login",
      register: "Register",
      logout: "Exit / Logout"
    },

    // Buttons & Actions
    btn: {
      submit: "Submit",
      cancel: "Cancel",
      save: "Save Changes",
      search: "Search",
      filter: "Apply Filters",
      retry: "Retry Action",
      assignOfficer: "Assign Officer",
      reassignOfficer: "Reassign Officer",
      confirm: "Confirmed",
      reject: "Rejected",
      needsInvestigation: "Needs Investigation",
      exportReport: "Export Report",
      trackDetails: "Track Details",
      back: "Back",
      askAI: "Ask AI Assistant",
      submitComplaint: "Lodge Grievance",
      startVoice: "Start Voice Recording",
      stopVoice: "Stop Recording",
      viewMap: "View Heatmap",
      clearFilters: "Clear Filters"
    },

    // Form Labels & Fields
    form: {
      title: "Grievance Title",
      category: "Category",
      priority: "Urgency Priority",
      department: "Department",
      description: "Detailed Description",
      address: "Address / Location Landmark",
      uploadPhoto: "Upload Issue Photo",
      selectCategory: "Select Category",
      selectDepartment: "Select Department",
      fullName: "Full Name",
      email: "Email Address",
      password: "Password",
      ward: "Ward / Zone",
      phone: "Phone Number",
      searchPlaceholder: "Search title, ID, or location..."
    },

    // Complaint Statuses
    status: {
      SUBMITTED: "Submitted",
      AI_ANALYSED: "AI Analysed",
      ASSIGNED: "Assigned to Officer",
      IN_PROGRESS: "Work In Progress",
      UNDER_VERIFICATION: "Under Verification",
      RESOLVED: "Resolved",
      CLOSED: "Closed",
      ESCALATED: "Escalated (SLA Crossed)"
    },

    // Priority Levels
    priority: {
      CRITICAL: "Critical",
      HIGH: "High",
      MEDIUM: "Medium",
      LOW: "Low"
    },

    // Categories
    category: {
      Roads: "Roads & Potholes",
      Sanitation: "Garbage & Sanitation",
      "Water Supply": "Water Supply & Leakage",
      "Sewage & Drainage": "Sewage & Drainage",
      Electricity: "Streetlights & Electricity",
      "General Civic": "General Civic Issue"
    },

    // Admin & Dashboard Labels
    dashboard: {
      totalComplaints: "Total Complaints",
      pending: "Pending Grievances",
      resolved: "Resolved Complaints",
      critical: "Critical Priority",
      escalated: "Pending Escalations",
      avgResolutionTime: "Avg Resolution Time",
      complaintsByCategory: "Complaints by Category",
      complaintsByDept: "Complaints by Department",
      priorityDist: "Priority Distribution",
      statusDist: "Status Distribution",
      complaintsOverTime: "Complaints Over Time",
      duplicateGroups: "Duplicate Complaint Clusters",
      hotspots: "Predictive Future Hotspots",
      officerWorkload: "Officer Workload Management",
      riskLevel: "Risk Level",
      smartAssignment: "Smart AI Officer Recommendation"
    },

    // Common Messages & Error States
    msg: {
      networkError: "Connection loss or server offline. Using grounded client engine.",
      loginRequired: "Please login with your citizen or admin account.",
      formError: "Please complete all required form fields.",
      noDataFound: "No complaints found matching your criteria.",
      privacyNotice: "🔒 Authenticated Privacy Protection: Only your own registered complaints are accessible.",
      historicalEstimate: "AI Estimate (Not a real-world completion guarantee)"
    }
  },

  hi: {
    // Navigation & Portal Header
    nav: {
      portalTitle: "भारत सरकार जन शिकायत एवं एआई लोक सेवा पोर्टल",
      emergencySupport: "आपतकालीन सहायता: 1800-11-2026",
      systemOperational: "● प्रणाली सक्रिय है",
      home: "मुख्य पृष्ठ",
      voiceComplaint: "आवाज से शिकायत",
      submitForm: "फॉर्म भरें",
      myComplaints: "मेरी शिकायतें",
      trackComplaint: "शिकायत ट्रैक करें",
      askJanSahayak: "जनसहायक AI से पूछें",
      profile: "प्रोफाइल",
      dashboard: "डैशबोर्ड",
      complaints: "शिकायत प्रबंधन",
      map: "सार्वजनिक समस्या मानचित्र",
      analytics: "पूर्वानुमानित विश्लेषण",
      officers: "अधिकारी कार्यभार",
      escalations: "SLA एस्केलेशन",
      aiInsights: "AI मूल कारण विश्लेषण",
      login: "लॉगिन",
      register: "पंजीकरण",
      logout: "निकास / लॉग आउट"
    },

    // Buttons & Actions
    btn: {
      submit: "जमा करें",
      cancel: "रद्द करें",
      save: "सुरक्षित करें",
      search: "खोजें",
      filter: "फिल्टर लगाएं",
      retry: "पुनः प्रयास करें",
      assignOfficer: "अधिकारी आवंटित करें",
      reassignOfficer: "पुनः आवंटित करें",
      confirm: "पुष्टि की गई",
      reject: "अस्वीकृत",
      needsInvestigation: "जांच की आवश्यकता",
      exportReport: "रिपोर्ट डाउनलोड करें",
      trackDetails: "विवरण देखें",
      back: "वापस जाएं",
      askAI: "AI से पूछें",
      submitComplaint: "शिकायत दर्ज करें",
      startVoice: "आवाज रिकॉर्डिंग शुरू करें",
      stopVoice: "रिकॉर्डिंग बंद करें",
      viewMap: "हीटमैप देखें",
      clearFilters: "फिल्टर हटाएं"
    },

    // Form Labels & Fields
    form: {
      title: "शिकायत का शीर्षक",
      category: "श्रेणी (Category)",
      priority: "प्राथमिकता (Urgency)",
      department: "विभाग (Department)",
      description: "विस्तृत विवरण",
      address: "पता / लैंडमार्क",
      uploadPhoto: "फोटो अपलोड करें",
      selectCategory: "श्रेणी चुनें",
      selectDepartment: "विभाग चुनें",
      fullName: "पूरा नाम",
      email: "ईमेल आईडी",
      password: "पासवर्ड",
      ward: "वार्ड / क्षेत्र",
      phone: "फोन नंबर",
      searchPlaceholder: "शीर्षक, आईडी या स्थान से खोजें..."
    },

    // Complaint Statuses
    status: {
      SUBMITTED: "दर्ज की गई (Submitted)",
      AI_ANALYSED: "AI विश्लेषित",
      ASSIGNED: "अधिकारी को आवंटित",
      IN_PROGRESS: "कार्य प्रगति पर",
      UNDER_VERIFICATION: "सत्यापनाधीन",
      RESOLVED: "समाधान हो गया",
      CLOSED: "बंद कर दी गई",
      ESCALATED: "एस्केलेटेड (SLA पार)"
    },

    // Priority Levels
    priority: {
      CRITICAL: "गंभीर (Critical)",
      HIGH: "उच्च (High)",
      MEDIUM: "मध्यम (Medium)",
      LOW: "कम (Low)"
    },

    // Categories
    category: {
      Roads: "सड़कें एवं गड्ढे",
      Sanitation: "कचरा एवं सफाई",
      "Water Supply": "जल आपूर्ति एवं रिसाव",
      "Sewage & Drainage": "सीवेज एवं नाली",
      Electricity: "स्ट्रीटलाइट एवं बिजली",
      "General Civic": "सामान्य नागरिक समस्या"
    },

    // Admin & Dashboard Labels
    dashboard: {
      totalComplaints: "कुल शिकायतें",
      pending: "लंबित शिकायतें",
      resolved: "निवारित शिकायतें",
      critical: "गंभीर प्राथमिकता",
      escalated: "लंबित एस्केलेशन",
      avgResolutionTime: "औसत निवारण समय",
      complaintsByCategory: "श्रेणी अनुसार शिकायतें",
      complaintsByDept: "विभाग अनुसार शिकायतें",
      priorityDist: "प्राथमिकता वितरण",
      statusDist: "स्थिति वितरण",
      complaintsOverTime: "समय अनुसार शिकायतें",
      duplicateGroups: "समान शिकायतों के समूह",
      hotspots: "पूर्वानुमानित समस्या क्षेत्र",
      officerWorkload: "अधिकारी कार्यभार प्रबंधन",
      riskLevel: "जोखिम स्तर",
      smartAssignment: "AI अनुशंसित अधिकारी"
    },

    // Common Messages & Error States
    msg: {
      networkError: "सर्वर नेटवर्क रुकावट। स्थानीय AI इंजन सक्रिय है।",
      loginRequired: "कृपया अपने नागरिक या एडमिन खाते से लॉगिन करें।",
      formError: "कृपया सभी आवश्यक फ़ील्ड भरें।",
      noDataFound: "आपकी खोज के अनुसार कोई शिकायत नहीं मिली।",
      privacyNotice: "🔒 गोपनीयता सुरक्षा: केवल आपकी स्वयं की शिकायतें दिखाई देती हैं।",
      historicalEstimate: "AI अनुमानित समय (गारंटी नहीं)"
    }
  }
};

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState(() => {
    return localStorage.getItem('jansahayak_lang') || 'en';
  });

  const setLanguage = (lang) => {
    if (lang === 'en' || lang === 'hi' || lang === 'hinglish') {
      setLanguageState(lang);
      localStorage.setItem('jansahayak_lang', lang);
    }
  };

  /**
   * Helper function t(path, fallback)
   * Example: t('nav.home') => 'Home' or 'मुख्य पृष्ठ'
   */
  const t = (path, fallback = '') => {
    if (!path) return fallback;
    const parts = path.split('.');
    let obj = translations[language];

    for (const p of parts) {
      if (obj && obj[p] !== undefined) {
        obj = obj[p];
      } else {
        // Fallback to English if missing in Hindi
        let enObj = translations.en;
        for (const ep of parts) {
          if (enObj && enObj[ep] !== undefined) {
            enObj = enObj[ep];
          } else {
            return fallback || path;
          }
        }
        return enObj || fallback || path;
      }
    }
    return obj;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isHindi: language === 'hi' }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
