/**
 * Automatic Language Detection Utility for JanSahayak AI Voice Grievance
 * 
 * Automatically detects whether text/speech is Hindi, Hinglish, or English.
 * - Hindi: Devanagari script (e.g. "हमारे मोहल्ले की सड़क बहुत खराब है")
 * - English: English text (e.g. "The road near my house is damaged.")
 * - Hinglish: Roman script Hindi phonetics or mixed Hindi-English script
 *             (e.g. "Mere area ki road bahut kharab hai" or "मेरे area में road बहुत खराब है")
 */

export const detectLanguage = (text) => {
  if (!text || typeof text !== 'string' || !text.trim()) {
    return null;
  }

  const trimmed = text.trim();

  // 1. Devanagari Script Regex Range (\u0900-\u097F)
  const devanagariRegex = /[\u0900-\u097F]/g;
  const devanagariMatches = trimmed.match(devanagariRegex) || [];
  const devanagariCharCount = devanagariMatches.length;

  // 2. Latin Alphabet Regex Range ([a-zA-Z])
  const latinMatches = trimmed.match(/[a-zA-Z]/g) || [];
  const latinCharCount = latinMatches.length;

  // 3. Hinglish Romanized Hindi Keyword List (case-insensitive)
  const hinglishKeywords = [
    'mera', 'meri', 'mere', 'apna', 'apne', 'apni', 'humare', 'hamare', 'hamara',
    'kharab', 'kharaab', 'paani', 'pani', 'sadak', 'gali', 'bahut', 'bohot', 'baut',
    'samasya', 'samakshya', 'problem', 'hai', 'hain', 'ho', 'raha', 'rahi', 'rahe',
    'tha', 'thi', 'the', 'ko', 'se', 'me', 'mein', 'par', 'pe', 'ka', 'ki', 'ke',
    'aur', 'ya', 'karo', 'karna', 'chahiye', 'kafi', 'bhi', 'nhi', 'nahi', 'waha',
    'yaha', 'kuch', 'kya', 'kaise', 'kahan', 'kaha', 'dijiye', 'bijli', 'kachra',
    'safai', 'nall', 'gadda', 'gaddha', 'pothole', 'pichle', 'din', 'raat', 'gaye',
    'chahiye', 'karwao', 'bhai', 'bhaisahab', 'ji', 'plz', 'sir', 'sahab'
  ];

  const words = trimmed.toLowerCase().split(/[^\w\u0900-\u097F]+/);
  const latinWords = words.filter(w => /^[a-z]+$/.test(w));
  
  let hinglishWordCount = 0;
  latinWords.forEach(w => {
    if (hinglishKeywords.includes(w)) {
      hinglishWordCount++;
    }
  });

  // Scenario A: Devanagari script is present
  if (devanagariCharCount > 0) {
    // If there are also multiple Latin words (e.g., "area", "road", "school", "problem"), it's mixed / Hinglish
    if (latinWords.length >= 2 || (latinCharCount > 8 && latinWords.length >= 1)) {
      return 'Hinglish';
    }
    // Predominantly Devanagari Hindi
    return 'Hindi';
  }

  // Scenario B: Roman script with Hinglish words or mixed vocabulary
  if (hinglishWordCount > 0 || (latinWords.length > 0 && hinglishWordCount >= 1)) {
    return 'Hinglish';
  }

  // Scenario C: Pure or predominantly English
  if (latinCharCount > 0) {
    return 'English';
  }

  return 'Hindi'; // fallback default
};
