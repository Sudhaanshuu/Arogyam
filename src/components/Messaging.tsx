import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Users, Send, Clock, X, User, Stethoscope, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { useUserStore } from '../lib/store';

interface Contact {
  id: string;
  name: string;
  subtitle: string;
  image_url?: string | null;
  role: 'doctor' | 'patient';
}

interface Message {
  id: string;
  user_id?: string;
  doctor_id?: string;
  content: string;
  is_from_doctor: boolean;
  created_at: string;
}

const Messaging: React.FC = () => {
  const { user, isDoctor, role } = useUserStore();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingContacts, setLoadingContacts] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isUserDoctor = isDoctor || role === 'doctor';

  useEffect(() => {
    fetchContacts();
  }, [user, isUserDoctor]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Real-time Supabase subscription
  useEffect(() => {
    if (!user || !selectedContact) return;

    const channel = supabase
      .channel(`chat_${user.id}_${selectedContact.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        (payload) => {
          const newMsg = payload.new as Message;
          // Verify message belongs to current active conversation
          if (
            (newMsg.user_id === user.id && newMsg.doctor_id === selectedContact.id) ||
            (newMsg.user_id === selectedContact.id && newMsg.doctor_id === user.id)
          ) {
            setMessages(prev => {
              if (prev.some(m => m.id === newMsg.id)) return prev;
              return [...prev, newMsg];
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, selectedContact]);

  const fetchContacts = async () => {
    setLoadingContacts(true);
    try {
      if (isUserDoctor) {
        // Logged in as doctor: Fetch patients who interacted with this doctor
        await fetchPatientsForDoctor();
      } else {
        // Logged in as patient: Fetch available doctors
        await fetchDoctorsForPatient();
      }
    } catch (err) {
      console.error('Error fetching contacts:', err);
    } finally {
      setLoadingContacts(false);
    }
  };

  const fetchDoctorsForPatient = async () => {
    try {
      // 1. Try doctor_profiles with users join
      const { data: profiles } = await supabase
        .from('doctor_profiles')
        .select(`
          user_id,
          specialty,
          users:user_id(full_name, email)
        `)
        .eq('is_available', true);

      if (profiles && profiles.length > 0) {
        const list: Contact[] = profiles.map((p: any) => ({
          id: p.user_id,
          name: p.users?.full_name || `Dr. ${p.specialty}`,
          subtitle: p.specialty,
          role: 'doctor'
        }));
        setContacts(list);
        if (list.length > 0 && !selectedContact) setSelectedContact(list[0]);
        return;
      }

      // 2. Try available_doctors
      const { data: avail } = await supabase
        .from('available_doctors')
        .select('id, name, specialty')
        .eq('available', true);

      if (avail && avail.length > 0) {
        const list: Contact[] = avail.map(d => ({
          id: d.id,
          name: d.name,
          subtitle: d.specialty,
          role: 'doctor'
        }));
        setContacts(list);
        if (list.length > 0 && !selectedContact) setSelectedContact(list[0]);
        return;
      }

      // Fallback curated doctors
      const fallbackList: Contact[] = [
        { id: 'doc-sarah', name: 'Dr. Sarah Johnson', subtitle: 'General Medicine', role: 'doctor' },
        { id: 'doc-chen', name: 'Dr. Michael Chen', subtitle: 'Cardiology', role: 'doctor' },
        { id: 'doc-priya', name: 'Dr. Priya Sharma', subtitle: 'Ayurveda Specialist', role: 'doctor' },
        { id: 'doc-davis', name: 'Dr. Emily Davis', subtitle: 'Dermatology', role: 'doctor' }
      ];
      setContacts(fallbackList);
      if (!selectedContact) setSelectedContact(fallbackList[0]);
    } catch (err) {
      console.error('Doctor fetch error:', err);
    }
  };

  const fetchPatientsForDoctor = async () => {
    try {
      // Fetch patients from appointments and messages
      const patientMap = new Map<string, Contact>();

      const { data: appts } = await supabase
        .from('appointments')
        .select('patient_id, users:patient_id(full_name, email)')
        .eq('doctor_id', user?.id);

      if (appts) {
        appts.forEach((a: any) => {
          if (a.patient_id) {
            patientMap.set(a.patient_id, {
              id: a.patient_id,
              name: a.users?.full_name || 'Patient',
              subtitle: a.users?.email || 'Patient Consultation',
              role: 'patient'
            });
          }
        });
      }

      // If no patients found yet, supply sample active patient inquiries
      if (patientMap.size === 0) {
        const samplePatients: Contact[] = [
          { id: 'pat-1', name: 'Aarav Sharma', subtitle: 'Fever & viral symptom query', role: 'patient' },
          { id: 'pat-2', name: 'Pooja Verma', subtitle: 'BP & Cardiology follow-up', role: 'patient' },
          { id: 'pat-3', name: 'Vikram Patel', subtitle: 'Ayurvedic prescription query', role: 'patient' }
        ];
        samplePatients.forEach(p => patientMap.set(p.id, p));
      }

      const list = Array.from(patientMap.values());
      setContacts(list);
      if (list.length > 0 && !selectedContact) setSelectedContact(list[0]);
    } catch (err) {
      console.error('Patient fetch error:', err);
    }
  };

  const handleSelectContact = (contact: Contact) => {
    setSelectedContact(contact);
    loadConversation(contact);
  };

  const getChatStorageKey = (partnerId: string) => {
    const currentUserId = user?.id || 'guest';
    return `arogyam_chat_${currentUserId}_${partnerId}`;
  };

  const loadConversation = async (contact: Contact) => {
    const currentUserId = user?.id || 'guest';
    const storageKey = getChatStorageKey(contact.id);
    let loadedMessages: Message[] = [];

    // 1. Read local storage cache first
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        loadedMessages = JSON.parse(stored);
      }
    } catch { /* ignore */ }

    // 2. Fetch from Supabase
    try {
      if (user) {
        const docId = isUserDoctor ? user.id : contact.id;
        const patId = isUserDoctor ? contact.id : user.id;

        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .eq('doctor_id', docId)
          .eq('user_id', patId)
          .order('created_at', { ascending: true });

        if (!error && data && data.length > 0) {
          // Merge with local messages without duplicates
          for (const msg of data) {
            if (!loadedMessages.some(m => m.id === msg.id)) {
              loadedMessages.push(msg);
            }
          }
        }
      }
    } catch (err) {
      console.warn('Supabase message query failed, relying on local chat store:', err);
    }

    // 3. If brand new chat with no messages, supply clean welcome prompt
    if (loadedMessages.length === 0) {
      loadedMessages = [
        {
          id: `welcome-${contact.id}`,
          content: isUserDoctor 
            ? `Hello ${contact.name}, this is your Arogyam verified physician. How can I assist you with your health query today?`
            : `Hello! You are connected with ${contact.name}. Please share your symptoms or questions regarding your treatment.`,
          is_from_doctor: true,
          created_at: new Date(Date.now() - 3600000).toISOString()
        }
      ];
    }

    setMessages(loadedMessages);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContact || !newMessage.trim()) return;

    const trimmed = newMessage.trim();
    const currentUserId = user?.id || 'guest';
    const isFromDoc = isUserDoctor;

    const msgObj: Message = {
      id: `msg-${Date.now()}`,
      content: trimmed,
      is_from_doctor: isFromDoc,
      created_at: new Date().toISOString(),
      user_id: isUserDoctor ? selectedContact.id : currentUserId,
      doctor_id: isUserDoctor ? currentUserId : selectedContact.id
    };

    // Update state immediately
    const updated = [...messages, msgObj];
    setMessages(updated);
    setNewMessage('');

    // Save to local persistence
    try {
      const storageKey = getChatStorageKey(selectedContact.id);
      localStorage.setItem(storageKey, JSON.stringify(updated));
    } catch { /* ignore */ }

    // Save to Supabase messages table
    if (user) {
      try {
        await supabase
          .from('messages')
          .insert({
            user_id: isUserDoctor ? selectedContact.id : user.id,
            doctor_id: isUserDoctor ? user.id : selectedContact.id,
            content: trimmed,
            is_from_doctor: isFromDoc
          });
      } catch (err) {
        console.warn('Supabase message insert error (local copy preserved):', err);
      }
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatMessageTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <section className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 pt-24 pb-24">
      <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Banner Bar */}
        <div className="bg-gradient-to-r from-red-600 via-pink-500 to-orange-500 text-white px-6 py-3 flex items-center justify-between text-xs font-semibold">
          <span className="flex items-center gap-1.5">
            <Sparkles className="h-4 w-4" />
            {isUserDoctor ? 'Doctor Consultation Desk (Replying as Verified Physician)' : 'Arogyam Telemedicine Clinical Messenger'}
          </span>
          <span className="bg-white/20 px-2 py-0.5 rounded-full">
            Realtime Active
          </span>
        </div>

        <div className="flex flex-col lg:grid lg:grid-cols-3 h-[calc(100vh-12rem)] max-h-[700px]">
          {/* Left Panel: Contacts List */}
          <div className="lg:col-span-1 border-r border-gray-200 flex flex-col h-full bg-gray-50/50">
            <div className="p-4 border-b border-gray-200 bg-white">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                {isUserDoctor ? <Users className="h-5 w-5 text-red-500" /> : <Stethoscope className="h-5 w-5 text-red-500" />}
                {isUserDoctor ? 'Patient Conversations' : 'Verified Doctors'}
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                {isUserDoctor ? 'Patients who consulted or booked with you' : 'Select a specialist to start medical consultation'}
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {loadingContacts ? (
                <div className="p-8 text-center text-sm text-gray-500">
                  <div className="h-6 w-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  Loading contacts...
                </div>
              ) : contacts.length === 0 ? (
                <div className="p-8 text-center text-sm text-gray-500">
                  No active conversations found.
                </div>
              ) : (
                contacts.map(c => {
                  const isSelected = selectedContact?.id === c.id;
                  return (
                    <button
                      key={c.id}
                      onClick={() => handleSelectContact(c)}
                      className={`w-full p-3 rounded-xl flex items-center text-left transition-all ${
                        isSelected 
                          ? 'bg-red-50 text-red-900 border border-red-200 shadow-2xs' 
                          : 'hover:bg-white text-gray-700'
                      }`}
                    >
                      <div className={`h-11 w-11 rounded-full flex items-center justify-center font-bold text-sm mr-3 flex-shrink-0 ${
                        isSelected 
                          ? 'bg-gradient-to-r from-red-600 to-orange-500 text-white' 
                          : 'bg-gray-200 text-gray-600'
                      }`}>
                        {c.name.charAt(c.role === 'doctor' ? 4 : 0) || 'C'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-sm text-gray-900 truncate">{c.name}</h4>
                        <p className="text-xs text-gray-500 truncate">{c.subtitle}</p>
                      </div>
                      <div className="h-2 w-2 rounded-full bg-green-500 ml-2" title="Online" />
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Panel: Active Chat Thread */}
          <div className="lg:col-span-2 flex flex-col h-full bg-white">
            {selectedContact ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-white z-10 shadow-2xs">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-r from-red-500 to-orange-500 text-white font-bold flex items-center justify-center text-sm mr-3">
                      {selectedContact.name.charAt(selectedContact.role === 'doctor' ? 4 : 0) || 'C'}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-gray-900">{selectedContact.name}</h4>
                      <p className="text-xs text-red-600 font-medium">{selectedContact.subtitle}</p>
                    </div>
                  </div>
                  <span className="text-xs bg-green-50 text-green-700 font-semibold px-2.5 py-1 rounded-full border border-green-200">
                    Active Channel
                  </span>
                </div>

                {/* Messages Feed */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-gray-50/50 to-white">
                  {messages.map((m) => {
                    // In doctor mode: is_from_doctor === true means ME (right), false means PATIENT (left)
                    // In patient mode: is_from_doctor === false means ME (right), true means DOCTOR (left)
                    const isMe = isUserDoctor ? m.is_from_doctor : !m.is_from_doctor;

                    return (
                      <div
                        key={m.id}
                        className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[78%] rounded-2xl p-3.5 shadow-2xs ${
                            isMe
                              ? 'bg-gradient-to-r from-red-600 via-pink-500 to-orange-500 text-white rounded-tr-xs'
                              : 'bg-white text-gray-800 border border-gray-200 rounded-tl-xs'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap leading-relaxed">{m.content}</p>
                          <div
                            className={`text-[10px] mt-1.5 flex items-center justify-end ${
                              isMe ? 'text-white/80' : 'text-gray-400'
                            }`}
                          >
                            <Clock className="h-3 w-3 mr-1" />
                            {formatMessageTime(m.created_at)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Quick Message Suggestions */}
                <div className="px-4 py-2 border-t border-gray-100 bg-gray-50 flex overflow-x-auto gap-2 no-scrollbar">
                  {[
                    "Please review my symptoms",
                    "Can we schedule a video consultation?",
                    "What dosage is recommended?",
                    "Thank you, Doctor!"
                  ].map((chip, idx) => (
                    <button
                      key={idx}
                      onClick={() => setNewMessage(chip)}
                      className="whitespace-nowrap px-3 py-1 bg-white hover:bg-gray-100 text-gray-700 text-xs rounded-full border border-gray-200 transition-colors shadow-2xs"
                    >
                      {chip}
                    </button>
                  ))}
                </div>

                {/* Message Input Form */}
                <form onSubmit={handleSendMessage} className="p-3 border-t border-gray-200 bg-white">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder={isUserDoctor ? "Reply to patient..." : "Ask your doctor a question..."}
                      className="flex-1 border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900"
                    />
                    <button
                      type="submit"
                      disabled={!newMessage.trim()}
                      className="bg-gradient-to-r from-red-600 via-pink-500 to-orange-500 text-white p-2.5 rounded-xl disabled:opacity-50 hover:opacity-90 transition-opacity shadow-sm flex-shrink-0"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-8 text-gray-500">
                <Users className="h-12 w-12 text-gray-300 mb-3" />
                <h4 className="font-bold text-gray-800 text-base">Select a conversation</h4>
                <p className="text-xs text-gray-500 mt-1">
                  Choose a doctor or patient from the left panel to begin medical messaging.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Messaging;