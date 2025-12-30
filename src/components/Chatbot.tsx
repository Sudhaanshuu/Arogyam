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
  const [conversationContext, setConversationContext] = useState<string[]>([]);
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

    // Add user message
    setMessages(prev => [...prev, { text: trimmedInput, isBot: false }]);
    
    // Update conversation context
    setConversationContext(prev => [...prev.slice(-4), trimmedInput]); // Keep last 5 messages for context
    
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
    // First try to get a contextual response based on conversation
    const contextualResponse = getContextualResponse(userInput);
    if (contextualResponse) {
      return contextualResponse;
    }

    try {
      // Try the Hugging Face API as a secondary option
      const medicalPrompt = `User: ${userInput}\nAssistant: As a helpful medical assistant for Arogyam healthcare platform,`;
      
      const response = await fetch(
        'https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_HUGGINGFACE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            inputs: medicalPrompt,
            parameters: {
              max_length: 100,
              temperature: 0.8,
              do_sample: true,
              top_p: 0.9,
              pad_token_id: 50256
            }
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log('API Response:', data);
        
        if (Array.isArray(data) && data.length > 0 && data[0]?.generated_text) {
          const generatedText = data[0].generated_text.replace(medicalPrompt, '').trim();
          if (generatedText && generatedText.length > 10) {
            return generatedText;
          }
        }
      }
    } catch (error) {
      console.error('API Error:', error);
    }
    
    // Always fall back to our curated responses
    return getFallbackResponse(userInput);
  };

  const getContextualResponse = (userInput: string): string | null => {
    const input = userInput.toLowerCase();
    
    // Check if this is a follow-up question based on conversation context
    const lastContext = conversationContext[conversationContext.length - 1]?.toLowerCase() || '';
    
    // Follow-up responses
    if (input.includes('how') && lastContext.includes('appointment')) {
      return "To book an appointment: 1) Click on 'Book Appointment' in our navigation, 2) Select your preferred doctor and specialty, 3) Choose an available time slot, 4) Fill in your details. It's that simple!";
    }
    
    if (input.includes('cost') || input.includes('price') || input.includes('fee')) {
      return "Our consultation fees vary by doctor and specialty. You can see the exact fees when booking an appointment. We also accept various payment methods for your convenience.";
    }
    
    if (input.includes('video call') || input.includes('online consultation')) {
      return "Yes! We offer video consultations with our doctors. After booking an appointment, you'll receive a link to join the video call at your scheduled time.";
    }
    
    if (input.includes('prescription') || input.includes('medicine delivery')) {
      return "After your consultation, doctors can provide digital prescriptions. You can use our medicine search feature to find and order medications from verified pharmacies.";
    }
    
    return null; // No contextual response found
  };

  const getFallbackResponse = (userInput: string): string => {
    const input = userInput.toLowerCase();
    
    // Greeting responses
    if (input.includes('hello') || input.includes('hi') || input.includes('hey')) {
      const greetings = [
        "Hello! I'm here to help you with your healthcare needs. What can I assist you with today?",
        "Hi there! Welcome to Arogyam. How can I help you with your health concerns?",
        "Hey! I'm your Arogyam assistant. Feel free to ask me about appointments, medicines, or health queries."
      ];
      return greetings[Math.floor(Math.random() * greetings.length)];
    }
    
    // Appointment related
    if (input.includes('appointment') || input.includes('book') || input.includes('schedule')) {
      const appointmentResponses = [
        "I can help you book an appointment! Please use our appointment booking feature to schedule a consultation with one of our qualified doctors.",
        "Ready to see a doctor? Use our easy appointment booking system to find available slots with our healthcare professionals.",
        "Let's get you scheduled! Our appointment booking feature will help you find the perfect time to consult with our doctors."
      ];
      return appointmentResponses[Math.floor(Math.random() * appointmentResponses.length)];
    }
    
    // Medicine related
    if (input.includes('medicine') || input.includes('drug') || input.includes('medication')) {
      const medicineResponses = [
        "For medicine information, please use our medicine search feature or consult with our doctors. Always consult a healthcare professional before taking any medication.",
        "I recommend using our medicine search tool for detailed drug information. For personalized advice, book a consultation with our doctors.",
        "Our medicine database can help you find information about medications. However, please consult with our qualified doctors for proper medical advice."
      ];
      return medicineResponses[Math.floor(Math.random() * medicineResponses.length)];
    }
    
    // Symptoms related
    if (input.includes('symptom') || input.includes('pain') || input.includes('fever') || input.includes('headache') || input.includes('cough')) {
      const symptomResponses = [
        "I understand you're experiencing symptoms. For proper diagnosis and treatment, please book a consultation with one of our doctors.",
        "Symptoms can be concerning. Our qualified doctors can provide proper evaluation - please schedule an appointment for personalized care.",
        "For any health symptoms, it's best to consult with a medical professional. Use our appointment system to connect with our doctors."
      ];
      return symptomResponses[Math.floor(Math.random() * symptomResponses.length)];
    }
    
    // Emergency
    if (input.includes('emergency') || input.includes('urgent') || input.includes('serious')) {
      return "⚠️ For medical emergencies, please contact your local emergency services immediately (call 108 in India). Our telemedicine service is for non-emergency consultations.";
    }
    
    // Ayurveda related
    if (input.includes('ayurveda') || input.includes('herbal') || input.includes('natural')) {
      const ayurvedaResponses = [
        "Ayurveda offers wonderful natural healing approaches! Our platform features qualified Ayurvedic practitioners who can guide you with traditional treatments.",
        "Interested in natural healing? Our Ayurvedic doctors can help you with herbal medicines and traditional treatment approaches.",
        "Ayurveda combines ancient wisdom with modern healthcare. Book a consultation with our Ayurvedic specialists for personalized natural treatments."
      ];
      return ayurvedaResponses[Math.floor(Math.random() * ayurvedaResponses.length)];
    }
    
    // Doctor related
    if (input.includes('doctor') || input.includes('specialist')) {
      const doctorResponses = [
        "Our platform has qualified doctors across various specialties. You can book appointments, have video consultations, or chat with them directly.",
        "Looking for a doctor? We have experienced healthcare professionals ready to help. Use our appointment system to connect with the right specialist.",
        "Our team includes doctors from various medical fields. Browse our doctor profiles and book a consultation that suits your needs."
      ];
      return doctorResponses[Math.floor(Math.random() * doctorResponses.length)];
    }
    
    // General health questions
    if (input.includes('health') || input.includes('wellness') || input.includes('fitness')) {
      const healthResponses = [
        "Health and wellness are important! Our doctors can provide personalized advice for your health goals. Would you like to book a consultation?",
        "Great question about health! For personalized wellness advice, I recommend consulting with our healthcare professionals.",
        "Your health matters! Our platform offers comprehensive healthcare services including consultations, medicine search, and health monitoring."
      ];
      return healthResponses[Math.floor(Math.random() * healthResponses.length)];
    }
    
    // Default responses
    const defaultResponses = [
      "I'm here to help with your healthcare questions! You can book appointments, search for medicines, or consult with our qualified doctors.",
      "Welcome to Arogyam! I can assist you with appointment booking, medicine information, or connecting you with our healthcare professionals.",
      "How can I help you today? I can guide you through our services like doctor consultations, appointment booking, and medicine search.",
      "I'm your healthcare assistant! Feel free to ask about our services, book appointments, or get information about medicines and treatments."
    ];
    
    return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
  };

  return (
    <>
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-[60] bg-gradient-to-r from-red-600 via-pink-500 to-orange-500 text-white p-4 rounded-full shadow-lg hover:opacity-90 transition-opacity"
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
            className="fixed bottom-20 right-6 z-[60] w-80 sm:w-96 bg-white rounded-lg shadow-xl overflow-hidden max-h-[calc(100vh-8rem)]"
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

            <div className="h-80 overflow-y-auto p-4 bg-gray-50 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
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

            <form onSubmit={handleSubmit} className="p-3 border-t border-gray-200 bg-white">
              <div className="flex gap-2">
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
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Chatbot;