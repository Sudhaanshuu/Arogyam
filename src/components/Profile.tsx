import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit, User, Mail, Phone, MapPin } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getUserProfile, updateUserProfile } from '../lib/supabase';
import toast from 'react-hot-toast';

interface ProfileData {
  id?: string;
  name?: string;
  email?: string;
  phone?: string;
  city?: string;
}

const Profile: React.FC = () => {
  const [profile, setProfile] = useState<ProfileData>({});
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<ProfileData>({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        navigate('/login');
        return;
      }
  
      const { data, error } = await getUserProfile(user.id);
  
      if (error || !data) {
        console.error("Error fetching profile:", error);
        
        // If the profile doesn't exist, create one
        const { data: insertData, error: insertError } = await supabase
          .from('profiles')
          .insert([{ id: user.id, name: '', phone: '', city: '' }])
          .select()
          .single();
        
        if (insertError) {
          toast.error('Failed to create profile');
          console.error("Error creating profile:", insertError);
          setLoading(false);
          return;
        }
        
        const newProfile = {
          ...insertData,
          email: user.email
        };
        
        setProfile(newProfile);
        setEditedProfile(newProfile);
        setLoading(false);
        return;
      }
  
      const profileData = {
        ...data,
        email: user.email
      };
      
      setProfile(profileData);
      setEditedProfile(profileData);
    } catch (error) {
      toast.error('An error occurred');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  const handleUpdate = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast.error('Authentication error');
        navigate('/login');
        return;
      }

      const { error } = await updateUserProfile(user.id, {
        name: editedProfile.name,
        phone: editedProfile.phone,
        city: editedProfile.city
      });

      if (error) {
        toast.error('Failed to update profile');
        console.error("Error updating profile:", error);
        return;
      }

      setProfile(editedProfile);
      setIsEditing(false);
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error('An error occurred');
      console.error(error);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="text-red-600 text-xl">Loading profile...</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white shadow-lg rounded-xl p-8">
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
      </div>
    </div>
  );
};

export default Profile;