import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Edit, User, Mail, Phone, MapPin, Calendar, Video, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

interface ProfileData {
  id?: string;
  name?: string;
  email?: string;
  phone?: string;
  city?: string;
}

interface Appointment {
  id: string;
  doctor: {
    name: string;
    specialty: string;
  };
  appointment_date: string;
  status: string;
  video_session_id: string;
}

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileData>({});
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<ProfileData>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
    fetchAppointments();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/login');
        return;
      }

      // First try to get from users table (matches the store)
      let { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (userError && userError.code === 'PGRST116') {
        // User profile doesn't exist in users table, try profiles table
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError && profileError.code === 'PGRST116') {
          // Neither table has the profile, create it in users table
          const newProfile = {
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || user.user_metadata?.name || '',
            phone: '',
            city: ''
          };

          const { error: insertError } = await supabase
            .from('users')
            .insert([newProfile]);

          if (insertError) {
            console.error('Error creating profile in users table:', insertError);
            // Try creating in profiles table as fallback
            const profileFallback = {
              id: user.id,
              email: user.email,
              name: user.user_metadata?.full_name || user.user_metadata?.name || '',
              phone: '',
              city: ''
            };

            const { error: profileInsertError } = await supabase
              .from('profiles')
              .insert([profileFallback]);

            if (profileInsertError) throw profileInsertError;

            const displayProfile = {
              id: user.id,
              name: profileFallback.name,
              email: user.email,
              phone: '',
              city: ''
            };
            setProfile(displayProfile);
            setEditedProfile(displayProfile);
          } else {
            const displayProfile = {
              id: user.id,
              name: newProfile.full_name,
              email: user.email,
              phone: newProfile.phone,
              city: newProfile.city
            };
            setProfile(displayProfile);
            setEditedProfile(displayProfile);
          }
        } else if (profileError) {
          throw profileError;
        } else {
          // Found in profiles table
          const displayProfile = {
            id: profileData.id,
            name: profileData.name,
            email: user.email,
            phone: profileData.phone,
            city: profileData.city
          };
          setProfile(displayProfile);
          setEditedProfile(displayProfile);
        }
      } else if (userError) {
        throw userError;
      } else {
        // Found in users table
        const displayProfile = {
          id: userData.id,
          name: userData.full_name || userData.name,
          email: user.email,
          phone: userData.phone,
          city: userData.city
        };
        setProfile(displayProfile);
        setEditedProfile(displayProfile);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile. Please try refreshing the page.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAppointments = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      const { data, error } = await supabase
        .from('appointments')
        .select(`
          id,
          appointment_date,
          status,
          video_session_id,
          doctor:doctor_id (
            name,
            specialty
          )
        `)
        .eq('user_id', user.id)
        .order('appointment_date', { ascending: false });

      if (error) throw error;
      
      // Transform the data to handle the doctor relationship properly
      const transformedAppointments = data?.map(appointment => ({
        ...appointment,
        doctor: Array.isArray(appointment.doctor) 
          ? appointment.doctor[0] 
          : appointment.doctor || { name: 'Unknown Doctor', specialty: 'General' }
      })) || [];
      
      setAppointments(transformedAppointments);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      toast.error('Failed to load appointments');
    }
  };

  const handleUpdate = async () => {
    try {
      // Try updating users table first
      let { error: userUpdateError } = await supabase
        .from('users')
        .update({
          full_name: editedProfile.name,
          phone: editedProfile.phone,
          city: editedProfile.city
        })
        .eq('id', profile.id);

      if (userUpdateError) {
        // Fallback to profiles table
        const { error: profileUpdateError } = await supabase
          .from('profiles')
          .update({
            name: editedProfile.name,
            phone: editedProfile.phone,
            city: editedProfile.city
          })
          .eq('id', profile.id);

        if (profileUpdateError) throw profileUpdateError;
      }

      setProfile(editedProfile);
      setIsEditing(false);
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile. Please try again.');
    }
  };

  const generateMeetingId = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const joinVideoCall = async (appointmentId: string, existingSessionId?: string) => {
    try {
      let sessionId = existingSessionId;

      if (!sessionId) {
        sessionId = generateMeetingId();
        
        // Create new video session
        const { error: sessionError } = await supabase
          .from('video_sessions')
          .insert([{
            id: sessionId,
            appointment_id: appointmentId,
            status: 'active'
          }]);

        if (sessionError) throw sessionError;

        // Update appointment with session ID
        const { error: updateError } = await supabase
          .from('appointments')
          .update({ video_session_id: sessionId })
          .eq('id', appointmentId);

        if (updateError) throw updateError;
      }

      navigate(`/video-consultation?room=${sessionId}`);
    } catch (error) {
      console.error('Error setting up video call:', error);
      toast.error('Failed to start video call');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-2xl text-gray-600">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Profile Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-lg p-8"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">My Profile</h2>
            <button 
              onClick={() => setIsEditing(!isEditing)}
              className="text-red-600 hover:text-red-700 flex items-center"
            >
              <Edit className="h-5 w-5 mr-1" />
              {isEditing ? 'Cancel' : 'Edit'}
            </button>
          </div>

          {isEditing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input 
                  type="text"
                  value={editedProfile.name || ''}
                  onChange={(e) => setEditedProfile({...editedProfile, name: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input 
                  type="email"
                  value={editedProfile.email || ''}
                  disabled
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <input 
                  type="text"
                  value={editedProfile.phone || ''}
                  onChange={(e) => setEditedProfile({...editedProfile, phone: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">City</label>
                <input 
                  type="text"
                  value={editedProfile.city || ''}
                  onChange={(e) => setEditedProfile({...editedProfile, city: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                />
              </div>
              <button 
                onClick={handleUpdate}
                className="w-full bg-red-600 text-white py-2 rounded-md hover:bg-red-700"
              >
                Save Changes
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center">
                <User className="h-6 w-6 mr-3 text-gray-500" />
                <span className="text-gray-900">{profile.name || 'Not set'}</span>
              </div>
              <div className="flex items-center">
                <Mail className="h-6 w-6 mr-3 text-gray-500" />
                <span className="text-gray-900">{profile.email || 'Not set'}</span>
              </div>
              <div className="flex items-center">
                <Phone className="h-6 w-6 mr-3 text-gray-500" />
                <span className="text-gray-900">{profile.phone || 'Not set'}</span>
              </div>
              <div className="flex items-center">
                <MapPin className="h-6 w-6 mr-3 text-gray-500" />
                <span className="text-gray-900">{profile.city || 'Not set'}</span>
              </div>
            </div>
          )}
        </motion.div>

        {/* Appointments Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-lg p-8"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-6">My Appointments</h2>
          
          {appointments.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No appointments scheduled</p>
            </div>
          ) : (
            <div className="space-y-4">
              {appointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        Dr. {appointment.doctor.name}
                      </h3>
                      <p className="text-gray-600">{appointment.doctor.specialty}</p>
                      <div className="flex items-center mt-2 text-sm text-gray-500">
                        <Calendar className="h-4 w-4 mr-1" />
                        {format(new Date(appointment.appointment_date), 'PPP')}
                        <Clock className="h-4 w-4 ml-4 mr-1" />
                        {format(new Date(appointment.appointment_date), 'p')}
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      appointment.status === 'completed' ? 'bg-green-100 text-green-800' :
                      appointment.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {appointment.status}
                    </span>
                  </div>
                  
                  {appointment.status === 'confirmed' && (
                    <button
                      onClick={() => joinVideoCall(appointment.id, appointment.video_session_id)}
                      className="mt-4 flex items-center justify-center w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-red-600 via-pink-500 to-orange-500 hover:opacity-90"
                    >
                      <Video className="h-4 w-4 mr-2" />
                      {appointment.video_session_id ? 'Join Video Call' : 'Start Video Call'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Profile;