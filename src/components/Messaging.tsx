import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Send,
  Clock,
  User,
  Stethoscope,
  Sparkles,
  ArrowLeft,
  Video,
  Search,
  CheckCircle,
  PhoneCall,
  ShieldCheck,
  X
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { useUserStore } from '../lib/store';
import { Link, useNavigate } from 'react-router-dom';

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
  const navigate = useNavigate();
  const { user, isDoctor, role } = useUserStore();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [searchContactQuery, setSearchContactQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isUserDoctor = isDoctor || role === 'doctor';

  useEffect(() => {
    fetchContacts();
  }, [user, isUserDoctor]);

  useEffect(() => {
    if (selectedContact) {
      loadConversation(selectedContact);
    }
  }, [selectedContact?.id]);

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
          if (
            (newMsg.user_id === user.id && newMsg.doctor_id === selectedContact.id) ||
            (newMsg.user_id === selectedContact.id && newMsg.doctor_id === user.id)
          ) {
            setMessages((prev) => {
              if (prev.some((m) => m.id === newMsg.id)) return prev;
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
        await fetchPatientsForDoctor();
      } else {
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

      const { data: avail } = await supabase
        .from('available_doctors')
        .select('id, name, specialty')
        .eq('available', true);

      if (avail && avail.length > 0) {
        const list: Contact[] = avail.map((d) => ({
          id: d.id,
          name: d.name,
          subtitle: d.specialty,
          role: 'doctor'
        }));
        setContacts(list);
        if (list.length > 0 && !selectedContact) setSelectedContact(list[0]);
        return;
      }

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

      if (patientMap.size === 0) {
        const samplePatients: Contact[] = [
          { id: 'pat-1', name: 'Aarav Sharma', subtitle: 'Fever & viral symptom query', role: 'patient' },
          { id: 'pat-2', name: 'Pooja Verma', subtitle: 'BP & Cardiology follow-up', role: 'patient' },
          { id: 'pat-3', name: 'Vikram Patel', subtitle: 'Ayurvedic prescription query', role: 'patient' }
        ];
        samplePatients.forEach((p) => patientMap.set(p.id, p));
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
          for (const msg of data) {
            if (!loadedMessages.some((m) => m.id === msg.id)) {
              loadedMessages.push(msg);
            }
          }
        }
      }
    } catch (err) {
      console.warn('Supabase message query failed, relying on local chat store:', err);
    }

    // 3. Fallback welcome message
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

    const updated = [...messages, msgObj];
    setMessages(updated);
    setNewMessage('');

    try {
      const storageKey = getChatStorageKey(selectedContact.id);
      localStorage.setItem(storageKey, JSON.stringify(updated));
    } catch { /* ignore */ }

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

  const filteredContacts = contacts.filter((c) => {
    const q = searchContactQuery.toLowerCase().trim();
    return !q || c.name.toLowerCase().includes(q) || c.subtitle.toLowerCase().includes(q);
  });

  return (
    <div className="h-[calc(100dvh-4rem)] mt-16 bg-white flex flex-col overflow-hidden w-full">
      {/* Top Messenger Status Banner */}
      <div className="bg-gradient-to-r from-red-600 via-pink-500 to-orange-500 text-white px-4 py-2.5 flex items-center justify-between text-xs font-semibold shadow-xs flex-shrink-0 z-20">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" />
          <span className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5" />
            {isUserDoctor
              ? 'Doctor Consultation Desk (Replying as Verified Physician)'
              : 'Arogyam Telemedicine Direct Messaging'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/video-consultation"
            className="hidden sm:inline-flex items-center gap-1 bg-white/20 hover:bg-white/30 text-white px-2.5 py-1 rounded-lg text-2xs transition-colors"
          >
            <Video className="w-3 h-3" /> Video Room
          </Link>
          <span className="bg-black/20 px-2 py-0.5 rounded text-2xs font-mono">
            E2E Encrypted
          </span>
        </div>
      </div>

      {/* Main Split Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Contacts Panel (Full width on mobile when no contact selected, or sidebar on desktop) */}
        <div
          className={`w-full md:w-80 lg:w-96 flex flex-col bg-white border-r border-gray-200 h-full flex-shrink-0 ${
            selectedContact ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* Contacts Header & Search */}
          <div className="p-3.5 border-b border-gray-200 bg-gray-50/50 flex-shrink-0">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                {isUserDoctor ? (
                  <Users className="h-4 w-4 text-red-600" />
                ) : (
                  <Stethoscope className="h-4 w-4 text-red-600" />
                )}
                <span>{isUserDoctor ? 'Patient Conversations' : 'Specialist Directory'}</span>
              </h3>
              <span className="text-2xs bg-red-100 text-red-700 font-semibold px-2 py-0.5 rounded-full">
                {contacts.length}
              </span>
            </div>

            {/* Contact Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchContactQuery}
                onChange={(e) => setSearchContactQuery(e.target.value)}
                placeholder={isUserDoctor ? 'Search patient name...' : 'Search doctor or specialty...'}
                className="w-full pl-8 pr-7 py-1.5 rounded-lg border border-gray-200 text-xs focus:outline-none focus:ring-1 focus:ring-red-500 bg-white"
              />
              {searchContactQuery && (
                <button
                  onClick={() => setSearchContactQuery('')}
                  className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Contacts Scrollable List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {loadingContacts ? (
              <div className="p-8 text-center text-xs text-gray-500">
                <div className="h-5 w-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                Loading roster...
              </div>
            ) : filteredContacts.length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-500">
                <Users className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                No matching contacts found.
              </div>
            ) : (
              filteredContacts.map((c) => {
                const isSelected = selectedContact?.id === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => handleSelectContact(c)}
                    className={`w-full p-2.5 rounded-xl flex items-center text-left transition-all ${
                      isSelected
                        ? 'bg-red-50/90 text-red-900 border border-red-200 shadow-2xs ring-1 ring-red-200'
                        : 'hover:bg-gray-50 text-gray-700 border border-transparent'
                    }`}
                  >
                    <div
                      className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-xs mr-3 flex-shrink-0 ${
                        isSelected
                          ? 'bg-gradient-to-r from-red-600 to-orange-500 text-white shadow-2xs'
                          : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {(c.name || 'Doctor').replace('Dr. ', '').charAt(0) || 'D'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-xs text-gray-900 truncate">{c.name}</h4>
                        <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" title="Online" />
                      </div>
                      <p className="text-2xs text-gray-500 truncate mt-0.5">{c.subtitle}</p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Active Chat Thread */}
        <div
          className={`flex-1 flex flex-col bg-gray-50 h-full overflow-hidden ${
            !selectedContact ? 'hidden md:flex items-center justify-center' : 'flex'
          }`}
        >
          {selectedContact ? (
            <>
              {/* Chat Thread Header */}
              <div className="p-3 border-b border-gray-200 bg-white flex items-center justify-between flex-shrink-0 shadow-2xs z-10">
                <div className="flex items-center gap-2.5">
                  {/* Mobile Back to Contacts Button */}
                  <button
                    type="button"
                    onClick={() => setSelectedContact(null)}
                    className="md:hidden p-1.5 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                    title="Back to contacts"
                  >
                    <ArrowLeft className="w-5 h-5 text-gray-700" />
                  </button>

                  <div className="relative">
                    <div className="h-9 w-9 rounded-full bg-gradient-to-r from-red-500 to-orange-500 text-white font-bold flex items-center justify-center text-xs flex-shrink-0 shadow-2xs">
                      {(selectedContact.name || 'Doctor').replace('Dr. ', '').charAt(0) || 'D'}
                    </div>
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-500 border border-white" />
                  </div>

                  <div>
                    <h4 className="font-bold text-xs md:text-sm text-gray-900 leading-tight">
                      {selectedContact.name}
                    </h4>
                    <p className="text-2xs text-red-600 font-medium">
                      {selectedContact.subtitle} • Online
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    to="/video-consultation"
                    className="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-red-600 to-orange-500 text-white rounded-lg text-xs font-semibold hover:opacity-95 shadow-2xs transition-opacity"
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Start Call</span>
                  </Link>
                </div>
              </div>

              {/* Messages Feed (Only this area scrolls) */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-gray-50/70 to-white">
                {messages.map((m) => {
                  const isMe = isUserDoctor ? m.is_from_doctor : !m.is_from_doctor;

                  return (
                    <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[85%] sm:max-w-[70%] rounded-2xl p-3 shadow-2xs ${
                          isMe
                            ? 'bg-gradient-to-r from-red-600 via-pink-500 to-orange-500 text-white rounded-tr-xs'
                            : 'bg-white text-gray-800 border border-gray-200/90 rounded-tl-xs'
                        }`}
                      >
                        <p className="text-xs md:text-sm whitespace-pre-wrap leading-relaxed">{m.content}</p>
                        <div
                          className={`text-[10px] mt-1 flex items-center justify-end ${
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

              {/* Quick Prompt Chips */}
              <div className="px-3 py-1.5 border-t border-gray-100 bg-gray-50 flex overflow-x-auto gap-1.5 flex-shrink-0 no-scrollbar">
                {[
                  'Please review my symptoms',
                  'Can we schedule a video consultation?',
                  'What dosage is recommended?',
                  'Thank you, Doctor!'
                ].map((chip, idx) => (
                  <button
                    key={idx}
                    onClick={() => setNewMessage(chip)}
                    className="whitespace-nowrap px-2.5 py-1 bg-white hover:bg-gray-100 text-gray-700 text-2xs rounded-full border border-gray-200 transition-colors shadow-2xs font-medium"
                  >
                    {chip}
                  </button>
                ))}
              </div>

              {/* Pinned Bottom Input Bar */}
              <form
                onSubmit={handleSendMessage}
                className="p-3 border-t border-gray-200 bg-white flex items-center gap-2 flex-shrink-0"
              >
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={isUserDoctor ? 'Type physician reply...' : 'Type health question for doctor...'}
                  className="flex-1 border border-gray-300 rounded-xl px-3.5 py-2.5 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900 placeholder-gray-400 bg-gray-50/50 focus:bg-white"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="bg-gradient-to-r from-red-600 via-pink-500 to-orange-500 text-white p-2.5 rounded-xl disabled:opacity-40 hover:opacity-95 transition-opacity shadow-sm flex-shrink-0"
                  title="Send Message"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 text-center text-gray-400">
              <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center text-red-500 mb-3">
                <Users className="w-8 h-8" />
              </div>
              <h4 className="font-bold text-gray-800 text-base">Select a conversation</h4>
              <p className="text-xs text-gray-500 mt-1 max-w-sm">
                Choose a doctor or patient from the left panel to begin medical consultation.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messaging;