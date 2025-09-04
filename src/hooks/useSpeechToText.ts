import { useState, useEffect, useRef } from 'react';

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionError extends Event {
  error: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionError) => any) | null;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

interface UseSpeechToTextReturn {
  transcript: string;
  isListening: boolean;
  startListening: (autoStop?: boolean) => void;
  stopListening: () => void;
  isSupported: boolean;
  error: string | null;
  onSpeechEnd?: (finalTranscript: string) => void;
}

// Convert Indonesian number words to digits
function convertIndonesianNumbersToDigits(text: string): string {
  const numberMap: { [key: string]: string } = {
    // Basic numbers
    'nol': '0',
    'satu': '1',
    'dua': '2',
    'tiga': '3',
    'empat': '4',
    'lima': '5',
    'enam': '6',
    'tujuh': '7',
    'delapan': '8',
    'sembilan': '9',
    'sepuluh': '10',
    'sebelas': '11',
    'dua belas': '12',
    'tiga belas': '13',
    'empat belas': '14',
    'lima belas': '15',
    'enam belas': '16',
    'tujuh belas': '17',
    'delapan belas': '18',
    'sembilan belas': '19',
    'dua puluh': '20',
    'tiga puluh': '30',
    'empat puluh': '40',
    'lima puluh': '50',
    'enam puluh': '60',
    'tujuh puluh': '70',
    'delapan puluh': '80',
    'sembilan puluh': '90',
    'seratus': '100',
    'seribu': '1000'
  };

  let result = text.toLowerCase();
  
  // Replace number words with digits
  for (const [word, digit] of Object.entries(numberMap)) {
    const regex = new RegExp(word, 'gi');
    result = result.replace(regex, digit);
  }
  
  // Extract all numbers from the result
  const numbers = result.match(/\d+/g);
  return numbers ? numbers.join('') : '';
}

export function useSpeechToText(onSpeechEnd?: (finalTranscript: string) => void): UseSpeechToTextReturn {
  const [transcript, setTranscript] = useState<string>('');
  const [isListening, setIsListening] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const autoStopModeRef = useRef<boolean>(false);
  const finalTranscriptRef = useRef<string>('');

  const isSupported = typeof window !== 'undefined' && 
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  useEffect(() => {
    if (!isSupported) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = true; // Keep listening continuously
    recognition.interimResults = true; // Enable interim results for faster response
    recognition.lang = 'id-ID'; // Indonesian language

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = '';
      let currentFinalTranscript = '';
      
      // Process all results (both interim and final)
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          currentFinalTranscript += result[0].transcript;
        } else {
          interimTranscript += result[0].transcript;
        }
      }
      
      // Update final transcript for processing when recognition ends
      if (currentFinalTranscript && currentFinalTranscript.trim().length > 0) {
        finalTranscriptRef.current = currentFinalTranscript;
        // Also update display with final transcript
        const convertedNumbers = convertIndonesianNumbersToDigits(currentFinalTranscript);
        if (convertedNumbers && convertedNumbers.length > 0) {
          setTranscript(convertedNumbers);
        }
      } else if (interimTranscript && interimTranscript.trim().length > 0) {
        // Show interim results for visual feedback
        const convertedNumbers = convertIndonesianNumbersToDigits(interimTranscript);
        if (convertedNumbers && convertedNumbers.length > 0) {
          setTranscript(convertedNumbers);
        }
      }
      
      // Auto-stop after silence only in hold mode
      if (currentFinalTranscript && autoStopModeRef.current) {
        // Clear any existing timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        
        timeoutRef.current = setTimeout(() => {
          if (recognitionRef.current && isListening) {
            recognitionRef.current.stop();
          }
        }, 2000);
      }
    };

    recognition.onerror = (event: SpeechRecognitionError) => {
      setError(`Speech recognition error: ${event.error}`);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      
      // Process the final transcript when recognition ends
      if (finalTranscriptRef.current && finalTranscriptRef.current.trim().length > 0) {
        const convertedNumbers = convertIndonesianNumbersToDigits(finalTranscriptRef.current);
        
        if (convertedNumbers && convertedNumbers.length > 0) {
          setTranscript(convertedNumbers);
          
          // Call the callback with final result
          if (onSpeechEnd) {
            onSpeechEnd(convertedNumbers);
          }
        }
      }
      
      // Reset final transcript
      finalTranscriptRef.current = '';
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [isSupported]);

  const startListening = (autoStop: boolean = false) => {
    if (!isSupported || !recognitionRef.current) {
      setError('Speech recognition is not supported in this browser');
      return;
    }

    try {
      setTranscript('');
      setError(null);
      finalTranscriptRef.current = '';
      autoStopModeRef.current = autoStop;
      recognitionRef.current.start();
    } catch (err) {
      setError('Failed to start speech recognition');
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  };

  return {
    transcript,
    isListening,
    startListening,
    stopListening,
    isSupported,
    error,
    onSpeechEnd
  };
}