import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Users, Send, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

// Define interfaces for type safety
interface Doctor {
  id: string;
  name: string;
  specialty: string;
  image_url?: string | null;
}

interface Message {
  id: string;
  content: string;
  is_from_doctor: boolean;
  created_at: string;
}

const Messaging: React.FC = () => {
  // State variables
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch doctors when component mounts
  useEffect(() => {
    fetchDoctors();
  }, []);

  // Scroll to bottom of messages
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch available doctors
  const fetchDoctors = async () => {
    try {
      // First try to get from doctor_profiles table
      const { data: doctorProfiles, error: profileError } = await supabase
        .from('doctor_profiles')
        .select(`
          user_id,
          specialty,
          is_available,
          is_verified,
          users!inner(
            id,
            full_name,
            email
          )
        `)
        .eq('is_verified', true)
        .eq('is_available', true);

      if (!profileError && doctorProfiles && doctorProfiles.length > 0) {
        const transformedDoctors = doctorProfiles.map(profile => ({
          id: profile.user_id,
          name: (profile.users as any)?.full_name || `Dr. ${profile.specialty}`,
          specialty: profile.specialty,
          image_url: null as string | null
        }));
        setDoctors(transformedDoctors);
        return;
      }

      // Fallback to available_doctors table
      const { data: availableDoctors, error: availableError } = await supabase
        .from('available_doctors')
        .select('*')
        .eq('available', true);

      if (!availableError && availableDoctors && availableDoctors.length > 0) {
        setDoctors(availableDoctors);
        return;
      }

      // If both fail, create some sample doctors for testing
      console.warn('No doctors found in database, using sample data');
      const sampleDoctors: Doctor[] = [
        {
          id: 'sample-1',
          name: 'Dr. Sarah Johnson',
          specialty: 'General Medicine',
          image_url: null
        },
        {
          id: 'sample-2', 
          name: 'Dr. Michael Chen',
          specialty: 'Cardiology',
          image_url: null
        },
        {
          id: 'sample-3',
          name: 'Dr. Emily Davis',
          specialty: 'Dermatology', 
          image_url: null
        }
      ];
      setDoctors(sampleDoctors);
      
    } catch (error) {
      console.error('Error fetching doctors:', error);
      toast.error('Failed to fetch doctors. Please try again.');
      
      // Set empty array to show no doctors available
      setDoctors([]);
    }
  };

  // Select a doctor and fetch their messages
  const handleSelectDoctor = async (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    
    // Fetch messages for this doctor
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('doctor_id', doctor.id)
      .order('created_at', { ascending: true });

    if (error) {
      toast.error('Failed to fetch messages');
      return;
    }

    setMessages(data || []);
  };

  // Send a new message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedDoctor || !newMessage.trim()) return;

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      toast.error('Please log in to send a message');
      return;
    }

    const { error } = await supabase
      .from('messages')
      .insert({
        user_id: user.id,
        doctor_id: selectedDoctor.id,
        content: newMessage,
        is_from_doctor: false
      });

    if (error) {
      toast.error('Failed to send message');
      return;
    }

    // Optimistically update messages
    setMessages(prev => [
      ...prev, 
      { 
        id: `temp-${Date.now()}`, 
        content: newMessage, 
        is_from_doctor: false, 
        created_at: new Date().toISOString() 
      }
    ]);

    setNewMessage('');
  };

  // Format message timestamp
  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    });
  };

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-6xl mx-auto bg-white rounded-xl shadow-lg"
      >
        <div className="grid grid-cols-3 h-[700px]">
          {/* Doctors List */}
          <div className="col-span-1 border-r border-gray-200 overflow-y-auto">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">Doctors</h3>
            </div>
            {doctors.length === 0 ? (
              <div className="p-4 text-center">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">No doctors available</p>
                <button 
                  onClick={fetchDoctors}
                  className="mt-2 text-red-600 hover:text-red-700 text-sm font-medium"
                >
                  Retry
                </button>
              </div>
            ) : (
              doctors.map(doctor => (
                <div 
                  key={doctor.id}
                  onClick={() => handleSelectDoctor(doctor)}
                  className={`p-4 flex items-center cursor-pointer hover:bg-gray-50 ${
                    selectedDoctor?.id === doctor.id ? 'bg-gray-100' : ''
                  }`}
                >
                  {doctor.image_url ? (
                    <img 
                      src={doctor.image_url} 
                      alt={doctor.name} 
                      className="h-12 w-12 rounded-full object-cover mr-4"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-gradient-to-r from-red-600 via-pink-500 to-orange-500 flex items-center justify-center mr-4">
                      <Users className="h-6 w-6 text-white" />
                    </div>
                  )}
                  <div>
                    <h4 className="font-medium text-gray-900">{doctor.name}</h4>
                    <p className="text-sm text-gray-500">{doctor.specialty}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Messages Area */}
          <div className="col-span-2 flex flex-col">
            {selectedDoctor ? (
              <>
                {/* Doctor Header */}
                <div className="p-4 border-b border-gray-200 flex items-center">
                  <div className="flex items-center">
                    {selectedDoctor.image_url ? (
                      <img 
                        src={selectedDoctor.image_url} 
                        alt={selectedDoctor.name} 
                        className="h-12 w-12 rounded-full object-cover mr-4"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-gradient-to-r from-red-600 via-pink-500 to-orange-500 flex items-center justify-center mr-4">
                        <Users className="h-6 w-6 text-white" />
                      </div>
                    )}
                    <div>
                      <h4 className="font-medium text-gray-900">{selectedDoctor.name}</h4>
                      <p className="text-sm text-gray-500">{selectedDoctor.specialty}</p>
                    </div>
                  </div>
                </div>
                
                {/* Messages List */}
                <div className="flex-1 p-4 overflow-y-auto">
                  {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                        <Users className="h-8 w-8 text-gray-400" />
                      </div>
                      <h4 className="text-lg font-medium text-gray-900">Start a conversation</h4>
                      <p className="text-gray-500 mt-1">
                        Send a message to Dr. {selectedDoctor.name} to get medical advice
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${
                            message.is_from_doctor ? 'justify-start' : 'justify-end'
                          }`}
                        >
                          <div
                            className={`max-w-[80%] rounded-lg p-3 ${
                              message.is_from_doctor
                                ? 'bg-gray-100 text-gray-800'
                                : 'bg-gradient-to-r from-red-600 via-pink-500 to-orange-500 text-white'
                            }`}
                          >
                            <p>{message.content}</p>
                            <div
                              className={`text-xs mt-1 flex items-center ${
                                message.is_from_doctor ? 'text-gray-500' : 'text-white/80'
                              }`}
                            >
                              <Clock className="h-3 w-3 mr-1" />
                              {formatMessageTime(message.created_at)}
                            </div>
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </div>
                
                {/* Message Input */}
                <div className="p-4 border-t border-gray-200">
                  <form onSubmit={handleSendMessage} className="flex">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type your message..."
                      className="flex-1 border border-gray-300 rounded-l-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                    <button
                      type="submit"
                      disabled={!newMessage.trim()}
                      className="bg-gradient-to-r from-red-600 via-pink-500 to-orange-500 text-white px-4 py-2 rounded-r-lg disabled:opacity-50"
                    >
                      <Send className="h-5 w-5" />
                    </button>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-4">
                <div className="h-20 w-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                  <Users className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-medium text-gray-900">No conversation selected</h3>
                <p className="text-gray-500 mt-2 max-w-md">
                  Select a doctor from the list to start a conversation and get medical advice
                </p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </section>
  );
};

export default Messaging;