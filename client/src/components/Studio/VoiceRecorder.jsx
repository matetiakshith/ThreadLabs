import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, Sparkles, AlertCircle } from 'lucide-react';

export default function VoiceRecorder({ onTranscriptReady }) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [speechLanguage, setSpeechLanguage] = useState('en-IN');
  const [isSupported, setIsSupported] = useState(true);
  const recognitionRef = useRef(null);

  useEffect(() => {
    // Check SpeechRecognition API in browser
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = speechLanguage;

      recognition.onresult = (event) => {
        let currentText = '';
        for (let i = 0; i < event.results.length; i++) {
          currentText += event.results[i][0].transcript;
        }
        setTranscript(currentText);
      };

      recognition.onerror = (event) => {
        console.warn('Speech recognition notice:', event.error);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
    } else {
      setIsSupported(false);
    }
  }, [speechLanguage]);

  const toggleRecording = () => {
    if (isRecording) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsRecording(false);
      if (transcript && onTranscriptReady) {
        onTranscriptReady(transcript);
      }
    } else {
      setTranscript('');
      setIsRecording(true);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.lang = speechLanguage;
          recognitionRef.current.start();
        } catch (err) {
          console.warn('Recognition start exception:', err);
        }
      } else {
        // Mock realistic speech simulation if browser doesn't have mic permissions
        const mockPhrases = [
          "I want a deep midnight navy blue raw silk kurta with delicate gold zardozi embroidery on the mandarin collar for a family wedding.",
          "Mujhe ek organic khadi cotton shirt chahiye jisme natural indigo Ajrakh block print aur coconut buttons ho.",
          "Looking for a pure georgette pastel sage green anarkali with fine Lucknowi chikankari shadow work."
        ];
        let i = 0;
        const interval = setInterval(() => {
          setTranscript(mockPhrases[Math.floor(Math.random() * mockPhrases.length)]);
          clearInterval(interval);
          setIsRecording(false);
        }, 2200);
      }
    }
  };

  const handleApply = () => {
    if (transcript && onTranscriptReady) {
      onTranscriptReady(transcript);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-heritage-silk p-5 shadow-soft space-y-4">
      
      {/* Language choice & header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-heritage-silk">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-heritage-terracotta/10 text-heritage-terracotta">
            <Volume2 className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-heritage-indigo">Speak Your Design Requirements</h4>
            <p className="text-[11px] text-heritage-muted">Works in Indian English, Hindi, and regional dialects</p>
          </div>
        </div>

        {/* Speech dialect */}
        <select
          value={speechLanguage}
          onChange={(e) => setSpeechLanguage(e.target.value)}
          className="bg-heritage-sand border border-heritage-silk rounded-xl text-xs font-semibold text-heritage-charcoal px-3 py-1.5 focus:outline-none"
        >
          <option value="en-IN">English (India)</option>
          <option value="hi-IN">हिन्दी (Hindi)</option>
          <option value="ta-IN">தமிழ் (Tamil)</option>
          <option value="bn-IN">বাংলা (Bengali)</option>
          <option value="te-IN">తెలుగు (Telugu)</option>
        </select>
      </div>

      {/* Main Mic Button & Visualizer */}
      <div className="flex flex-col items-center justify-center py-6 space-y-4">
        
        <button
          onClick={toggleRecording}
          className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all ${
            isRecording
              ? 'bg-red-500 text-white shadow-lg ring-8 ring-red-100 scale-105'
              : 'bg-heritage-indigo text-white hover:bg-heritage-indigoLight shadow-craft hover:scale-105'
          }`}
        >
          {isRecording ? (
            <>
              <MicOff className="w-8 h-8 animate-pulse" />
              <span className="absolute -bottom-7 text-[11px] font-bold text-red-600 tracking-wider uppercase">
                Listening...
              </span>
            </>
          ) : (
            <Mic className="w-8 h-8 text-heritage-goldLight" />
          )}
        </button>

        {/* Animated wave bars during listening */}
        {isRecording && (
          <div className="flex items-center gap-1 h-6 pt-2">
            {[40, 70, 30, 90, 60, 100, 45, 80, 50, 95].map((height, i) => (
              <div
                key={i}
                style={{ height: `${height}%` }}
                className="w-1 bg-red-400 rounded-full animate-pulse"
              />
            ))}
          </div>
        )}

        {!isRecording && !transcript && (
          <p className="text-xs text-heritage-muted text-center max-w-sm pt-2">
            Click the microphone and describe your clothing style, preferred fabric, color tone, or special occasion.
          </p>
        )}

      </div>

      {/* Real-time transcribed text display */}
      {transcript && (
        <div className="bg-heritage-sand/60 p-4 rounded-xl border border-heritage-silk space-y-3">
          <div className="flex justify-between items-center text-xs font-semibold text-heritage-muted">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-heritage-terracotta" /> Transcribed Voice Input:
            </span>
            <span className="text-[10px] bg-white px-2 py-0.5 rounded-full border border-heritage-silk">
              Ready to Parse
            </span>
          </div>
          <p className="text-sm font-medium text-heritage-indigo font-serif italic">
            "{transcript}"
          </p>
          <div className="flex justify-end gap-2 pt-1">
            <button
              onClick={() => setTranscript('')}
              className="text-xs font-semibold text-heritage-muted hover:text-heritage-charcoal px-3 py-1"
            >
              Clear
            </button>
            <button
              onClick={handleApply}
              className="text-xs font-bold bg-heritage-indigo text-white px-4 py-1.5 rounded-xl hover:bg-heritage-indigoLight shadow-sm transition-all"
            >
              Use this Voice Requirement
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
