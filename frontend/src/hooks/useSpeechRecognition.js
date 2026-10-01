import { useState, useEffect, useRef, useCallback } from 'react';
import { detectLanguage } from '../utils/languageDetector';

export const useSpeechRecognition = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [detectedLanguage, setDetectedLanguage] = useState(null); // 'Hindi' | 'English' | 'Hinglish' | null
  const [detectionFailed, setDetectionFailed] = useState(false);
  const [error, setError] = useState(null);
  const [isSupported, setIsSupported] = useState(true);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);

  const recognitionRef = useRef(null);
  const timerRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
    }
  }, []);

  // Update detected language whenever transcript changes
  useEffect(() => {
    const fullText = `${transcript} ${interimTranscript}`.trim();
    if (fullText) {
      const lang = detectLanguage(fullText);
      setDetectedLanguage(lang);
      if (lang) {
        setDetectionFailed(false);
      }
    }
  }, [transcript, interimTranscript]);

  const startListening = useCallback(() => {
    setError(null);
    setDetectionFailed(false);
    setAudioUrl(null);
    setAudioBlob(null);
    audioChunksRef.current = [];
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      setError('Speech Recognition is not supported in this browser.');
      return;
    }

    try {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {
          // ignore
        }
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;

      // Use multilingual hi-IN STT engine as standard baseline for Hindi/Hinglish/English recognition
      recognition.lang = 'hi-IN';

      recognition.onstart = () => {
        setIsListening(true);
        setRecordingTime(0);
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
          setRecordingTime((prev) => prev + 1);
        }, 1000);
      };

      recognition.onresult = (event) => {
        let currentFinal = '';
        let currentInterim = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            currentFinal += result[0].transcript + ' ';
          } else {
            currentInterim += result[0].transcript;
          }
        }

        if (currentFinal) {
          setTranscript((prev) => {
            const updated = prev ? `${prev.trim()} ${currentFinal.trim()}` : currentFinal.trim();
            const lang = detectLanguage(updated);
            if (lang) setDetectedLanguage(lang);
            return updated;
          });
        }
        setInterimTranscript(currentInterim);
        
        const liveText = `${currentFinal} ${currentInterim}`.trim();
        if (liveText) {
          const detected = detectLanguage(liveText);
          if (detected) {
            setDetectedLanguage(detected);
            setDetectionFailed(false);
          }
        }
      };

      recognition.onerror = (event) => {
        console.warn('Speech recognition error:', event.error);
        if (event.error === 'no-speech') {
          // Don't treat no-speech as fatal immediately
          return;
        }
        if (event.error === 'not-allowed') {
          setError('Microphone permission denied. Please allow microphone access in your browser.');
        } else {
          setError(`Speech recognition notice: ${event.error}`);
        }
        setIsListening(false);
        if (timerRef.current) clearInterval(timerRef.current);
      };

      recognition.onend = () => {
        setIsListening(false);
        setInterimTranscript('');
        if (timerRef.current) clearInterval(timerRef.current);
      };

      recognitionRef.current = recognition;
      recognition.start();

      // MediaRecorder setup for voice playback
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ audio: true })
          .then((stream) => {
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;

            mediaRecorder.ondataavailable = (e) => {
              if (e.data.size > 0) {
                audioChunksRef.current.push(e.data);
              }
            };

            mediaRecorder.onstop = () => {
              const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
              const url = URL.createObjectURL(blob);
              setAudioBlob(blob);
              setAudioUrl(url);
              stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
          })
          .catch((err) => {
            console.warn('MediaRecorder access warning:', err);
          });
      }

    } catch (err) {
      console.error('Failed to start speech recognition:', err);
      setError('Could not access microphone or initialize speech engine.');
      setIsListening(false);
    }
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // ignore
      }
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {
        // ignore
      }
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setIsListening(false);
    setInterimTranscript('');

    // Check if recording finished with empty transcript
    setTimeout(() => {
      setTranscript((current) => {
        if (!current || !current.trim()) {
          setDetectionFailed(true);
        }
        return current;
      });
    }, 200);
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
    setDetectedLanguage(null);
    setDetectionFailed(false);
    setRecordingTime(0);
    setError(null);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    setAudioBlob(null);
  }, [audioUrl]);

  return {
    isListening,
    transcript,
    setTranscript,
    interimTranscript,
    detectedLanguage,
    setDetectedLanguage,
    detectionFailed,
    setDetectionFailed,
    error,
    isSupported,
    recordingTime,
    audioUrl,
    audioBlob,
    startListening,
    stopListening,
    resetTranscript,
  };
};
