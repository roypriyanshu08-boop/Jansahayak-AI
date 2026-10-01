/**
 * Intelligent Hindi, English, & Hinglish Complaint Parser
 * Extracts category, department, subcategory, title, address, and priority from raw speech text.
 */

export const parseVoiceTranscript = (text) => {
  if (!text || !text.trim()) {
    return {
      title: '',
      category: 'Water Supply',
      subcategory: 'General Issue',
      department: 'Jal Board',
      priority: 'MEDIUM',
      address: '',
    };
  }

  const cleanText = text.toLowerCase();

  // Keyword dictionary for Hindi / English / Hinglish
  const keywords = {
    water: ['water', 'paani', 'pani', 'pipeline', 'pipe', 'leak', 'leakage', 'tank', 'tanti', 'tap', 'jal', 'board'],
    road: ['road', 'sadak', 'sadak', 'gaddha', 'gaddhe', 'pothole', 'tar', 'asphalt', 'traffic', 'divider', 'footpath', 'street'],
    sanitation: ['garbage', 'kachra', 'kachra', 'safai', 'dustbin', 'cleanliness', 'smell', 'badboo', 'litter', 'kura', 'waste'],
    electricity: ['electricity', 'bijli', 'light', 'wire', 'taar', 'pole', 'khamba', 'transformer', 'dark', 'andhera', 'spark', 'current'],
    sewage: ['sewage', 'naali', 'nali', 'drain', 'gutter', 'gatar', 'overflow', 'ganda paani', 'sewer', 'blockage']
  };

  let detectedCategory = 'Water Supply';
  let detectedSubcategory = 'Pipe Leakage';
  let detectedDepartment = 'Jal Board';

  // Check matching scores
  let categoryScores = {
    water: 0,
    road: 0,
    sanitation: 0,
    electricity: 0,
    sewage: 0
  };

  for (const [cat, words] of Object.entries(keywords)) {
    for (const word of words) {
      if (cleanText.includes(word)) {
        categoryScores[cat] += 1;
      }
    }
  }

  const topCategory = Object.keys(categoryScores).reduce((a, b) => 
    categoryScores[a] >= categoryScores[b] ? a : b
  );

  switch (topCategory) {
    case 'road':
      detectedCategory = 'Roads & Transport';
      detectedSubcategory = cleanText.includes('gaddha') || cleanText.includes('pothole') ? 'Road Potholes & Cracks' : 'Road Damage';
      detectedDepartment = 'Public Works Dept (PWD)';
      break;
    case 'sanitation':
      detectedCategory = 'Sanitation & Waste';
      detectedSubcategory = 'Uncleared Garbage & Dustbins';
      detectedDepartment = 'Municipal Corporation';
      break;
    case 'electricity':
      detectedCategory = 'Electricity';
      detectedSubcategory = cleanText.includes('pole') || cleanText.includes('khamba') ? 'Faulty Street Light Pole' : 'Power / Line Sparking';
      detectedDepartment = 'State Electricity Board';
      break;
    case 'sewage':
      detectedCategory = 'Sewage';
      detectedSubcategory = 'Open Drain & Sewage Overflow';
      detectedDepartment = 'Municipal Corporation';
      break;
    case 'water':
    default:
      detectedCategory = 'Water Supply';
      detectedSubcategory = cleanText.includes('leak') || cleanText.includes('pipe') ? 'Water Pipe Leakage' : 'Low Pressure / Contaminated Water';
      detectedDepartment = 'Jal Board';
      break;
  }

  // Detect Priority
  const urgentWords = ['emergency', 'urgent', 'khatra', 'danger', 'risk', 'accident', 'spark', 'immediate', 'severe', 'turant'];
  const isUrgent = urgentWords.some(word => cleanText.includes(word));
  const priority = isUrgent ? 'Critical' : (categoryScores[topCategory] > 2 ? 'High' : 'MEDIUM');

  // Extract address hints if present
  let address = '';
  const addressMatch = text.match(/(?:near|in|at|sector|ward|colony|nagar|road|pas|samne)\s+([A-Za-z0-9\s,-]+)/i);
  if (addressMatch && addressMatch[1]) {
    address = addressMatch[1].trim().slice(0, 50);
  }

  // Generate a clean summary Title from transcript
  let title = text.trim();
  if (title.length > 70) {
    title = title.substring(0, 67) + '...';
  }

  return {
    title,
    category: detectedCategory,
    subcategory: detectedSubcategory,
    department: detectedDepartment,
    priority,
    address,
  };
};
