import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Bot, Mic, Volume2, Ear } from 'lucide-react';

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

const Chatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { 
      text: "Hello! I'm Arogyam Assistant. How can I help you today?", 
      isBot: true 
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [sttSupported, setSttSupported] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognition = useRef<any>(null);
  const synthesis = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    // Initialize speech recognition
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.webkitSpeechRecognition;
      recognition.current = new SpeechRecognition();
      recognition.current.continuous = false;
      recognition.current.interimResults = false;

      recognition.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(prev => prev + ' ' + transcript);
        setIsListening(false);
      };

      recognition.current.onerror = () => {
        setIsListening(false);
        setSttSupported(false);
      };
    } else {
      setSttSupported(false);
    }

    // Initialize speech synthesis
    synthesis.current = window.speechSynthesis;

    return () => {
      if (recognition.current) {
        recognition.current.stop();
      }
      if (synthesis.current?.speaking) {
        synthesis.current.cancel();
      }
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
    speakLastMessage();
  }, [messages, isTyping]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const speakLastMessage = () => {
    if (!ttsEnabled || !messages.length) return;
    
    const lastMessage = messages[messages.length - 1];
    if (lastMessage.isBot && !lastMessage.error && synthesis.current) {
      const utterance = new SpeechSynthesisUtterance(lastMessage.text);
      utterance.voice = synthesis.current.getVoices()[0];
      utterance.rate = 1.1;
      
      setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      synthesis.current.speak(utterance);
    }
  };

  const toggleSpeechRecognition = () => {
    if (!sttSupported) return;
    if (isListening) {
      recognition.current?.stop();
    } else {
      recognition.current?.start();
    }
    setIsListening(!isListening);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedInput = input.trim();
    if (!trimmedInput) return;

    setMessages(prev => [...prev, { text: trimmedInput, isBot: false }]);
    setInput('');
    setIsTyping(true);

    try {
      const botResponse = await getBotResponse(trimmedInput);
      setMessages(prev => [...prev, { text: botResponse, isBot: true }]);
    } catch (error) {
      console.error('API Error:', error);
      setMessages(prev => [...prev, { 
        text: error instanceof Error ? error.message : 'Sorry, I encountered an error. Please try again.', 
        isBot: true,
        error: true
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const getBotResponse = async (userInput: string): Promise<string> => {
    try {
      // Format the input for better medical responses
      const medicalPrompt = `As a helpful medical assistant, please provide accurate information about: ${userInput}`;
      
      const response = await fetch(
        'https://router.huggingface.co/models/google/flan-t5-large',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_HUGGINGFACE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            inputs: medicalPrompt,
            parameters: {
              max_length: 150,
              temperature: 0.7,
              do_sample: true
            }
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get response');
      }

      const data = await response.json();
      
      if (Array.isArray(data) && data[0]?.generated_text) {
        return data[0].generated_text;
      } else if (data.generated_text) {
        return data.generated_text;
      }
      
      // Fallback responses for common medical queries
      return getFallbackResponse(userInput);
    } catch (error) {
      console.error('API Error:', error);
      return getFallbackResponse(userInput);
    }
  };

  const getFallbackResponse = (userInput: string): string => {
    const input = userInput.toLowerCase();
    
    if (input.includes('appointment') || input.includes('book')) {
      return "I can help you book an appointment! Please use the appointment booking feature on our website to schedule a consultation with one of our qualified doctors.";
    }
    
    if (input.includes('medicine') || input.includes('drug')) {
      return "For medicine information, please consult with our doctors or use our medicine search feature. Always consult a healthcare professional before taking any medication.";
    }
    
    if (input.includes('symptom') || input.includes('pain') || input.includes('fever')) {
      return "I understand you're experiencing symptoms. For proper diagnosis and treatment, please book a consultation with one of our doctors through the appointment system.";
    }
    
    if (input.includes('emergency') || input.includes('urgent')) {
      return "For medical emergencies, please contact your local emergency services immediately. Our telemedicine service is for non-emergency consultations.";
    }
    
    if (input.includes('ayurveda') || input.includes('herbal')) {
      return "Ayurveda offers natural healing approaches. Our platform features qualified Ayurvedic practitioners who can guide you with traditional treatments and herbal medicines.";
    }
    
    return "I'm here to help with your healthcare questions! You can book appointments, search for medicines, or consult with our qualified doctors. For specific medical advice, please schedule a consultation.";
  };

  return (
    <>
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-red-600 via-pink-500 to-orange-500 text-white p-4 rounded-full shadow-lg hover:opacity-90 transition-opacity"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            className="fixed bottom-20 right-6 z-50 w-80 sm:w-96 bg-white rounded-lg shadow-xl overflow-hidden"
          >
            <div className="bg-gradient-to-r from-red-600 via-pink-500 to-orange-500 text-white p-4">
              <div className="flex items-center">
                <Bot className="h-6 w-6 mr-2" />
                <div className="flex-1">
                  <h3 className="font-medium">Arogyam Assistant</h3>
                  <p className="text-xs text-white/80">
                    {isSpeaking ? 'Speaking...' : 'Online'}
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => setTtsEnabled(!ttsEnabled)}
                    className={`p-1 rounded ${ttsEnabled ? 'bg-white/20' : ''}`}
                    title={ttsEnabled ? 'Disable text-to-speech' : 'Enable text-to-speech'}
                  >
                    <Volume2 className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={() => setIsOpen(false)}
                    className="text-white/80 hover:text-white"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>

            <div className="h-80 overflow-y-auto p-4 bg-gray-50">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`mb-3 flex ${message.isBot ? 'justify-start' : 'justify-end'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.error 
                        ? 'bg-red-100 text-red-700'
                        : message.isBot
                        ? 'bg-white text-gray-800 shadow-sm'
                        : 'bg-gradient-to-r from-red-600 via-pink-500 to-orange-500 text-white'
                    }`}
                  >
                    {message.text}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="mb-3 flex justify-start">
                  <div className="bg-white text-gray-800 rounded-lg p-3 shadow-sm">
                    <div className="flex space-x-1">
                      <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" />
                      <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSubmit} className="p-3 border-t border-gray-200 flex gap-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type or speak your message..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  disabled={isTyping}
                />
                {!sttSupported && (
                  <span className="absolute right-2 top-2 text-red-500" title="Speech to text not supported">
                    <Ear className="h-5 w-5" />
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                {sttSupported && (
                  <button
                    type="button"
                    onClick={toggleSpeechRecognition}
                    className={`p-2 rounded-lg ${isListening ? 'bg-red-500 text-white' : 'bg-gray-200'}`}
                    disabled={isTyping}
                  >
                    <Mic className="h-5 w-5" />
                  </button>
                )}
                <button
                  type="submit"
                  className="bg-gradient-to-r from-red-600 via-pink-500 to-orange-500 text-white px-4 py-2 rounded-lg disabled:opacity-50"
                  disabled={!input.trim() || isTyping}
                >
                  <Send className="h-5 w-5" />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Chatbot;