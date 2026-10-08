import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Bot, Mic, Volume2, Sparkles, RefreshCw } from 'lucide-react';
import { askMedicalAi } from '../lib/medicalAi';

type Message = {
  text: string;
  isBot: boolean;
  error?: boolean;
};

declare global {
  interface Window {
    webkitSpeechRecognition: any;
  }
}

const QUICK_TOPICS = [
  'Fever & Cold',
  'Headache & Stress',
  'Stomach & Acidity',
  'Skin Rash / Acne',
  'Ayurvedic Medicines',
  'Book Appointment'
];

const Chatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { 
      text: "Namaste! 🙏 I'm your Arogyam Health Assistant.\n\nAsk me about symptoms, doctor recommendations, Ayurvedic home remedies, or telemedicine appointments.", 
      isBot: true 
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const [sttSupported, setSttSupported] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognition = useRef<any>(null);
  const synthesis = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    // Initialize speech recognition
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || window.webkitSpeechRecognition;
      recognition.current = new SpeechRecognition();
      recognition.current.continuous = false;
      recognition.current.interimResults = false;

      recognition.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(prev => (prev ? prev + ' ' + transcript : transcript));
        setIsListening(false);
      };

      recognition.current.onerror = () => {
        setIsListening(false);
      };
      recognition.current.onend = () => {
        setIsListening(false);
      };
    } else {
      setSttSupported(false);
    }

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      synthesis.current = window.speechSynthesis;
    }

    return () => {
      if (recognition.current) {
        try { recognition.current.stop(); } catch { /* ignore */ }
      }
      if (synthesis.current?.speaking) {
        try { synthesis.current.cancel(); } catch { /* ignore */ }
      }
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
    if (ttsEnabled) {
      speakLastMessage();
    }
  }, [messages, isTyping]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const speakLastMessage = () => {
    if (!ttsEnabled || !messages.length || !synthesis.current) return;
    
    const lastMessage = messages[messages.length - 1];
    if (lastMessage.isBot && !lastMessage.error) {
      try {
        synthesis.current.cancel();
        // Remove markdown formatting characters for speech
        const cleanText = lastMessage.text.replace(/[*_#•]/g, '');
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.rate = 1.0;
        
        setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);
        synthesis.current.speak(utterance);
      } catch (err) {
        console.warn('TTS error:', err);
        setIsSpeaking(false);
      }
    }
  };

  const toggleSpeechRecognition = () => {
    if (!sttSupported || !recognition.current) return;
    if (isListening) {
      try { recognition.current.stop(); } catch { /* ignore */ }
      setIsListening(false);
    } else {
      try {
        recognition.current.start();
        setIsListening(true);
      } catch (err) {
        console.warn('STT start error:', err);
        setIsListening(false);
      }
    }
  };

  const handleSendMessage = async (userText: string) => {
    const trimmed = userText.trim();
    if (!trimmed) return;

    // Add user message
    const updatedMessages: Message[] = [...messages, { text: trimmed, isBot: false }];
    setMessages(updatedMessages);
    setInput('');
    setIsTyping(true);

    try {
      const reply = await askMedicalAi(trimmed, updatedMessages);
      setMessages(prev => [...prev, { text: reply, isBot: true }]);
    } catch (error) {
      console.error('Chatbot error:', error);
      setMessages(prev => [
        ...prev,
        { 
          text: "I experienced a temporary difficulty. For general consultations, please visit our Appointments tab or consult a doctor directly.", 
          isBot: true,
          error: true
        }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(input);
  };

  const resetChat = () => {
    if (synthesis.current?.speaking) synthesis.current.cancel();
    setMessages([
      { 
        text: "Namaste! 🙏 I'm your Arogyam Health Assistant.\n\nHow can I help you today? You can describe your symptoms or ask about our doctors.", 
        isBot: true 
      }
    ]);
  };

  // Helper to render text with bold and bullet support
  const renderMessageText = (content: string) => {
    return content.split('\n').map((line, lineIdx) => {
      if (!line.trim()) {
        return <div key={lineIdx} className="h-2" />;
      }

      // Check if bullet point
      const isBullet = line.trim().startsWith('•') || line.trim().startsWith('-');
      const displayLine = isBullet ? line.replace(/^[•-]\s*/, '') : line;

      // Parse bold segments **bold**
      const parts = displayLine.split(/(\*\*.*?\*\*)/g);

      return (
        <div key={lineIdx} className={`text-sm ${isBullet ? 'flex items-start pl-2 my-0.5' : 'my-0.5'}`}>
          {isBullet && <span className="mr-1.5 text-red-500 font-bold">•</span>}
          <span>
            {parts.map((part, pIdx) => {
              if (part.startsWith('**') && part.endsWith('**')) {
                return (
                  <strong key={pIdx} className="font-semibold text-gray-900">
                    {part.slice(2, -2)}
                  </strong>
                );
              }
              return <span key={pIdx}>{part}</span>;
            })}
          </span>
        </div>
      );
    });
  };

  return (
    <>
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-[60] bg-gradient-to-r from-red-600 via-pink-500 to-orange-500 text-white p-4 rounded-full shadow-2xl hover:opacity-95 transition-all flex items-center justify-center group"
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Open Arogyam Health Assistant"
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <div className="relative">
            <MessageSquare className="h-6 w-6" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-300 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-400"></span>
            </span>
          </div>
        )}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.92 }}
            transition={{ duration: 0.25 }}
            className="fixed bottom-24 right-4 sm:right-6 z-[60] w-[calc(100vw-2rem)] sm:w-[420px] bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200 flex flex-col h-[560px] max-h-[calc(100vh-8rem)]"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-red-600 via-pink-500 to-orange-500 text-white p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                  <Bot className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-base flex items-center gap-1.5">
                    Arogyam Assistant
                    <Sparkles className="h-3.5 w-3.5 text-yellow-300" />
                  </h3>
                  <p className="text-xs text-white/90">
                    {isSpeaking ? 'Speaking...' : 'Medical & Health Guidance'}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-1">
                <button
                  onClick={resetChat}
                  className="p-1.5 rounded-lg hover:bg-white/20 transition-colors text-white/90"
                  title="Reset Chat"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setTtsEnabled(!ttsEnabled)}
                  className={`p-1.5 rounded-lg hover:bg-white/20 transition-colors ${ttsEnabled ? 'bg-white/30 text-white' : 'text-white/80'}`}
                  title={ttsEnabled ? 'Mute Speech' : 'Enable Voice'}
                >
                  <Volume2 className="h-4 w-4" />
                </button>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-white/20 transition-colors text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Quick Topic Chips */}
            <div className="bg-gray-50 border-b border-gray-200 px-3 py-2 flex overflow-x-auto gap-1.5 no-scrollbar">
              {QUICK_TOPICS.map((topic, i) => (
                <button
                  key={i}
                  onClick={() => handleSendMessage(topic)}
                  className="whitespace-nowrap px-2.5 py-1 text-xs font-medium bg-white text-gray-700 hover:text-red-600 hover:border-red-300 rounded-full border border-gray-200 transition-colors shadow-2xs flex-shrink-0"
                >
                  {topic}
                </button>
              ))}
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 bg-gradient-to-b from-gray-50 to-white space-y-3">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.isBot ? 'justify-start' : 'justify-end'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl p-3.5 shadow-xs ${
                      message.error 
                        ? 'bg-red-50 text-red-700 border border-red-200'
                        : message.isBot
                        ? 'bg-white text-gray-800 border border-gray-100 rounded-tl-sm'
                        : 'bg-gradient-to-r from-red-600 via-pink-500 to-orange-500 text-white rounded-tr-sm'
                    }`}
                  >
                    {message.isBot ? (
                      <div>{renderMessageText(message.text)}</div>
                    ) : (
                      <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                    )}
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white text-gray-700 rounded-2xl rounded-tl-sm p-3 border border-gray-100 shadow-xs flex items-center space-x-1.5">
                    <span className="text-xs text-gray-500 mr-1">Reviewing medical insights</span>
                    <div className="h-2 w-2 bg-red-400 rounded-full animate-bounce" />
                    <div className="h-2 w-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="h-2 w-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <form onSubmit={handleSubmit} className="p-3 border-t border-gray-200 bg-white">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask symptoms, doctors, medicines..."
                  className="flex-1 border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                  disabled={isTyping}
                />
                {sttSupported && (
                  <button
                    type="button"
                    onClick={toggleSpeechRecognition}
                    className={`p-2.5 rounded-xl transition-colors ${
                      isListening ? 'bg-red-600 text-white animate-pulse' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                    title={isListening ? 'Listening...' : 'Voice Input'}
                    disabled={isTyping}
                  >
                    <Mic className="h-4 w-4" />
                  </button>
                )}
                <button
                  type="submit"
                  className="bg-gradient-to-r from-red-600 via-pink-500 to-orange-500 text-white p-2.5 rounded-xl disabled:opacity-50 hover:opacity-90 transition-opacity flex-shrink-0"
                  disabled={!input.trim() || isTyping}
                  title="Send message"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
              <p className="text-[10px] text-gray-400 text-center mt-1.5">
                For urgent emergencies, call 108. Consult a doctor for diagnostic decisions.
              </p>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Chatbot;