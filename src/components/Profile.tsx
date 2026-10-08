import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Edit, User, Mail, Phone, MapPin, Calendar, Video, Clock, 
  CheckCircle, XCircle, Stethoscope, PlusCircle, Shield
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { useUserStore } from '../lib/store';

interface ProfileData {
  id?: string;
  name?: string;
  email?: string;
  phone?: string;
  city?: string;
}

interface Appointment {
  id: string;
  patient_id?: string;
  doctor_id?: string;
  doctor?: {
    name: string;
    specialty: string;
  };
  patient_name?: string;
  appointment_date: string;
  status: string;
  video_session_id?: string;
  duration_minutes?: number;
}

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { user, isDoctor, isAdmin, role } = useUserStore();
  const [profile, setProfile] = useState<ProfileData>({});
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<ProfileData>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
    fetchAppointments();
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      if (!currentUser) {
        navigate('/login');
        return;
      }

      // Check users table
      let { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', currentUser.id)
        .maybeSingle();

      if (!userData) {
        // Fallback to profiles table
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', currentUser.id)
          .maybeSingle();

        if (profileData) {
          const display = {
            id: profileData.id,
            name: profileData.name || currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0],
            email: currentUser.email,
            phone: profileData.phone || '',
            city: profileData.city || ''
          };
          setProfile(display);
          setEditedProfile(display);
          return;
        }

        // Create initial profile in users table
        const newProfile = {
          id: currentUser.id,
          email: currentUser.email,
          full_name: currentUser.user_metadata?.full_name || currentUser.user_metadata?.name || currentUser.email?.split('@')[0],
          phone: '',
          city: ''
        };

        try {
          await supabase.from('users').upsert([newProfile]);
        } catch { /* ignore */ }

        const display = {
          id: currentUser.id,
          name: newProfile.full_name,
          email: currentUser.email,
          phone: '',
          city: ''
        };
        setProfile(display);
        setEditedProfile(display);
      } else {
        const display = {
          id: userData.id,
          name: userData.full_name || userData.name || currentUser.email?.split('@')[0],
          email: currentUser.email,
          phone: userData.phone || '',
          city: userData.city || ''
        };
        setProfile(display);
        setEditedProfile(display);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAppointments = async () => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) return;

      const apptList: Appointment[] = [];

      // 1. Fetch from local persistence cache
      try {
        const storageKey = `arogyam_appointments_${currentUser.id}`;
        const localData = JSON.parse(localStorage.getItem(storageKey) || '[]');
        if (Array.isArray(localData)) {
          apptList.push(...localData);
        }
      } catch (err) {
        console.warn('Could not read local appointments:', err);
      }

      // 2. Fetch from Supabase appointments table
      try {
        const isDoc = role === 'doctor' || isDoctor;
        const query = supabase
          .from('appointments')
          .select('*')
          .order('appointment_date', { ascending: false });

        const { data, error } = isDoc
          ? await query.eq('doctor_id', currentUser.id)
          : await query.eq('patient_id', currentUser.id);

        if (!error && data && data.length > 0) {
          const transformed = await Promise.all(
            data.map(async (item: any) => {
              let doctorInfo = { name: 'Doctor Specialist', specialty: 'General Medicine' };
              
              try {
                const { data: docData } = await supabase
                  .from('available_doctors')
                  .select('name, specialty')
                  .eq('id', item.doctor_id)
                  .maybeSingle();

                if (docData) {
                  doctorInfo = docData;
                } else {
                  const { data: profileData } = await supabase
                    .from('doctor_profiles')
                    .select('specialty, users!inner(full_name)')
                    .eq('user_id', item.doctor_id)
                    .maybeSingle();

                  if (profileData) {
                    doctorInfo = {
                      name: (profileData.users as any)?.full_name || `Dr. ${profileData.specialty}`,
                      specialty: profileData.specialty
                    };
                  }
                }
              } catch { /* ignore */ }

              return {
                id: item.id,
                patient_id: item.patient_id,
                doctor_id: item.doctor_id,
                doctor: doctorInfo,
                appointment_date: item.appointment_date,
                status: item.status || 'confirmed',
                video_session_id: item.video_session_id || `ROOM-${item.id.slice(0, 6)}`,
                duration_minutes: item.duration_minutes || 30
              };
            })
          );

          // Deduplicate by id
          for (const t of transformed) {
            if (!apptList.some(a => a.id === t.id)) {
              apptList.push(t);
            }
          }
        }
      } catch (dbErr) {
        console.warn('Database appointment fetch failed:', dbErr);
      }

      // Sort by date (descending)
      apptList.sort((a, b) => new Date(b.appointment_date).getTime() - new Date(a.appointment_date).getTime());
      setAppointments(apptList);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    }
  };

  const handleUpdate = async () => {
    try {
      if (!profile.id) return;

      await supabase
        .from('users')
        .update({
          full_name: editedProfile.name,
          phone: editedProfile.phone,
          city: editedProfile.city
        })
        .eq('id', profile.id);

      setProfile(editedProfile);
      setIsEditing(false);
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile. Please try again.');
    }
  };

  const handleUpdateAppointmentStatus = async (appointmentId: string, newStatus: string) => {
    const { data: { user: currentUser } } = await supabase.auth.getUser();

    // 1. Update in local storage
    if (currentUser) {
      const storageKey = `arogyam_appointments_${currentUser.id}`;
      try {
        const stored = JSON.parse(localStorage.getItem(storageKey) || '[]');
        const updated = stored.map((a: Appointment) =>
          a.id === appointmentId ? { ...a, status: newStatus } : a
        );
        localStorage.setItem(storageKey, JSON.stringify(updated));
      } catch { /* ignore */ }
    }

    // 2. Update in Supabase
    try {
      await supabase
        .from('appointments')
        .update({ status: newStatus })
        .eq('id', appointmentId);
    } catch (err) {
      console.warn('Supabase status update failed:', err);
    }

    // 3. Update component state
    setAppointments(prev =>
      prev.map(a => (a.id === appointmentId ? { ...a, status: newStatus } : a))
    );

    toast.success(`Appointment marked as ${newStatus}`);
  };

  const joinVideoCall = (appointmentId: string, sessionId?: string) => {
    const targetRoom = sessionId || `ROOM-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    navigate(`/video-consultation?room=${targetRoom}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="h-10 w-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-gray-600">Loading your Arogyam profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 pt-24 pb-24">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* User Identity / Role Banner */}
        <div className="bg-gradient-to-r from-red-600 via-pink-500 to-orange-500 rounded-2xl p-6 text-white shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="h-16 w-16 rounded-full bg-white text-red-600 font-bold text-2xl flex items-center justify-center shadow-md">
              {(profile.name || user?.email || 'U').charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl font-bold">{profile.name || 'User Profile'}</h1>
                {isAdmin && (
                  <span className="bg-white/20 text-white text-xs px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                    <Shield className="h-3 w-3" /> Admin
                  </span>
                )}
                {isDoctor && (
                  <span className="bg-white/20 text-white text-xs px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                    <Stethoscope className="h-3 w-3" /> Doctor
                  </span>
                )}
              </div>
              <p className="text-white/80 text-sm">{profile.email}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto">
            {isAdmin && (
              <Link
                to="/admin"
                className="px-4 py-2 bg-white text-red-600 font-bold rounded-xl text-sm shadow-md hover:bg-gray-100 transition-colors"
              >
                Admin Hub
              </Link>
            )}
            <Link
              to="/appointments"
              className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white font-semibold rounded-xl text-sm transition-colors flex items-center gap-1.5"
            >
              <PlusCircle className="h-4 w-4" /> Book New
            </Link>
          </div>
        </div>

        {/* Profile Details Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">Personal Information</h2>
            <button 
              onClick={() => setIsEditing(!isEditing)}
              className="text-red-600 hover:text-red-700 font-semibold text-sm flex items-center"
            >
              <Edit className="h-4 w-4 mr-1.5" />
              {isEditing ? 'Cancel Editing' : 'Edit Details'}
            </button>
          </div>

          {isEditing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Full Name</label>
                <input 
                  type="text"
                  value={editedProfile.name || ''}
                  onChange={(e) => setEditedProfile({...editedProfile, name: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-xl py-2.5 px-3.5 focus:ring-2 focus:ring-red-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email Address (Read-only)</label>
                <input 
                  type="email"
                  value={editedProfile.email || ''}
                  disabled
                  className="mt-1 block w-full border border-gray-200 rounded-xl py-2.5 px-3.5 bg-gray-100 text-gray-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                <input 
                  type="text"
                  placeholder="+91 9876543210"
                  value={editedProfile.phone || ''}
                  onChange={(e) => setEditedProfile({...editedProfile, phone: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-xl py-2.5 px-3.5 focus:ring-2 focus:ring-red-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">City / State</label>
                <input 
                  type="text"
                  placeholder="e.g. Bhubaneswar, Odisha"
                  value={editedProfile.city || ''}
                  onChange={(e) => setEditedProfile({...editedProfile, city: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-xl py-2.5 px-3.5 focus:ring-2 focus:ring-red-500 focus:outline-none"
                />
              </div>
              <button 
                onClick={handleUpdate}
                className="w-full bg-gradient-to-r from-red-600 via-pink-500 to-orange-500 text-white font-bold py-2.5 rounded-xl hover:opacity-90 shadow-md transition-opacity"
              >
                Save Changes
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center p-3 bg-gray-50 rounded-xl">
                <User className="h-5 w-5 mr-3 text-red-500" />
                <div>
                  <p className="text-xs text-gray-500">Name</p>
                  <p className="font-semibold text-gray-900">{profile.name || 'Not provided'}</p>
                </div>
              </div>
              <div className="flex items-center p-3 bg-gray-50 rounded-xl">
                <Mail className="h-5 w-5 mr-3 text-red-500" />
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="font-semibold text-gray-900">{profile.email || 'Not provided'}</p>
                </div>
              </div>
              <div className="flex items-center p-3 bg-gray-50 rounded-xl">
                <Phone className="h-5 w-5 mr-3 text-red-500" />
                <div>
                  <p className="text-xs text-gray-500">Phone</p>
                  <p className="font-semibold text-gray-900">{profile.phone || '+91 Not configured'}</p>
                </div>
              </div>
              <div className="flex items-center p-3 bg-gray-50 rounded-xl">
                <MapPin className="h-5 w-5 mr-3 text-red-500" />
                <div>
                  <p className="text-xs text-gray-500">Location</p>
                  <p className="font-semibold text-gray-900">{profile.city || 'India'}</p>
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* Appointments Section */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8"
        >
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-red-500" />
                {isDoctor ? 'Doctor Consultation Schedule' : 'My Telemedicine Appointments'}
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                {isDoctor 
                  ? 'Upcoming patient appointments and scheduled video sessions'
                  : 'Your booked consultations with Arogyam verified specialists'}
              </p>
            </div>
            <span className="text-xs font-bold px-3 py-1 bg-red-50 text-red-600 rounded-full border border-red-100">
              {appointments.length} Total
            </span>
          </div>
          
          {appointments.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-2xl">
              <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-gray-800">No appointments scheduled yet</h3>
              <p className="text-gray-500 text-sm mt-1 max-w-sm mx-auto">
                Ready to consult with a specialist? Book a telemedicine slot in under 2 minutes.
              </p>
              <Link
                to="/appointments"
                className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-red-600 to-orange-500 text-white font-bold text-sm rounded-xl shadow-md hover:opacity-90 transition-opacity"
              >
                <PlusCircle className="h-4 w-4" /> Book Appointment
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {appointments.map((appointment) => {
                const isConfirmed = appointment.status === 'confirmed';
                const isPending = appointment.status === 'pending';
                const isCompleted = appointment.status === 'completed';
                const isCancelled = appointment.status === 'cancelled';

                return (
                  <div
                    key={appointment.id}
                    className="border border-gray-200 rounded-2xl p-5 hover:border-red-300 transition-colors bg-white shadow-2xs"
                  >
                    <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-3">
                      <div>
                        <h3 className="font-bold text-gray-900 text-base">
                          {isDoctor 
                            ? `Patient: ${appointment.patient_name || 'Patient Consultation'}`
                            : `Dr. ${appointment.doctor?.name || 'Medical Specialist'}`}
                        </h3>
                        <p className="text-red-600 text-sm font-medium">
                          {appointment.doctor?.specialty || 'General Consultation'}
                        </p>
                        <div className="flex flex-wrap items-center mt-2 text-xs text-gray-500 gap-y-1">
                          <span className="flex items-center mr-4">
                            <Calendar className="h-3.5 w-3.5 mr-1 text-red-500" />
                            {format(new Date(appointment.appointment_date), 'PPP')}
                          </span>
                          <span className="flex items-center mr-4">
                            <Clock className="h-3.5 w-3.5 mr-1 text-red-500" />
                            {format(new Date(appointment.appointment_date), 'p')}
                          </span>
                          <span>• {appointment.duration_minutes || 30} mins</span>
                        </div>
                      </div>

                      <div>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                          isConfirmed ? 'bg-green-50 text-green-700 border-green-200' :
                          isPending ? 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse' :
                          isCompleted ? 'bg-blue-50 text-blue-700 border-blue-200' :
                          'bg-red-50 text-red-700 border-red-200'
                        }`}>
                          {appointment.status.toUpperCase()}
                        </span>
                      </div>
                    </div>
                    
                    {/* Action Bar */}
                    <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3">
                      <div className="text-xs text-gray-500">
                        {appointment.video_session_id && (
                          <span className="font-mono bg-gray-100 px-2.5 py-1 rounded-md text-gray-700">
                            Room ID: {appointment.video_session_id}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center space-x-2">
                        {/* Doctor Controls */}
                        {isDoctor && isPending && (
                          <button
                            onClick={() => handleUpdateAppointmentStatus(appointment.id, 'confirmed')}
                            className="px-3.5 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold shadow-2xs"
                          >
                            Accept & Confirm
                          </button>
                        )}
                        {isDoctor && isConfirmed && (
                          <button
                            onClick={() => handleUpdateAppointmentStatus(appointment.id, 'completed')}
                            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-2xs"
                          >
                            Mark Completed
                          </button>
                        )}

                        {/* Patient cancel if pending */}
                        {isPending && (
                          <button
                            onClick={() => handleUpdateAppointmentStatus(appointment.id, 'cancelled')}
                            className="px-3 py-1.5 border border-red-200 text-red-600 hover:bg-red-50 rounded-xl text-xs font-medium"
                          >
                            Cancel
                          </button>
                        )}

                        {/* Join Video Call Button */}
                        {(isConfirmed || isPending) && (
                          <button
                            onClick={() => joinVideoCall(appointment.id, appointment.video_session_id)}
                            className="flex items-center px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-red-600 via-pink-500 to-orange-500 hover:opacity-90 shadow-sm transition-opacity"
                          >
                            <Video className="h-3.5 w-3.5 mr-1.5" />
                            Join Video Consultation
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Profile;