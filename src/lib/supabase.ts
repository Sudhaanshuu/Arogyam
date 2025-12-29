import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Auth functions
export const signUp = async (email: string, password: string, fullName?: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName || email.split('@')[0]
      }
    }
  });
  return { data, error };
};

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

export const resetPassword = async (email: string) => {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  return { data, error };
};

// User profile functions
export const getUserProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();
  return { data, error };
};

export const updateUserProfile = async (userId: string, updates: any) => {
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', userId);
  return { data, error };
};

// Doctor functions
export const getDoctors = async () => {
  const { data, error } = await supabase
    .from('available_doctors')
    .select('*');
  return { data, error };
};

// Get verified doctor profiles for appointment booking
export const getVerifiedDoctors = async () => {
  const { data, error } = await supabase
    .from('doctor_profiles')
    .select(`
      id,
      user_id,
      specialty,
      sub_specialty,
      experience_years,
      rating,
      total_reviews,
      consultation_fee,
      bio,
      languages,
      is_available,
      is_verified,
      clinic_name,
      clinic_address
    `)
    .eq('is_verified', true)
    .eq('is_available', true);
  
  // Transform the data to match the expected format
  const transformedData = data?.map(profile => ({
    id: profile.user_id, // Use user_id as the doctor ID for appointments
    name: `Dr. ${profile.specialty} Specialist`, // Fallback name based on specialty
    specialty: profile.specialty,
    experience: profile.experience_years || 0,
    rating: profile.rating || 4.5,
    image_url: undefined,
    city: profile.clinic_name || 'Available Online',
    available: profile.is_available
  }));
  
  return { data: transformedData, error };
};

export const getDoctorsByCity = async (city: string) => {
  const { data, error } = await supabase
    .from('available_doctors')
    .select('*')
    .eq('city', city);
  return { data, error };
};

export const getDoctorById = async (id: string) => {
  const { data, error } = await supabase
    .from('available_doctors')
    .select('*')
    .eq('id', id)
    .single();
  return { data, error };
};

// Appointment functions
export const createAppointment = async (appointmentData: any) => {
  const { data, error } = await supabase
    .from('appointments')
    .insert([appointmentData])
    .select();
  return { data, error };
};

export const getUserAppointments = async (userId: string) => {
  const { data, error } = await supabase
    .from('appointments')
    .select(`
      *,
      doctor:doctor_id (
        full_name,
        email
      ),
      patient:patient_id (
        full_name,
        email
      )
    `)
    .or(`patient_id.eq.${userId},doctor_id.eq.${userId}`)
    .order('appointment_date', { ascending: true });
  return { data, error };
};

// Medicine functions
export const searchMedicines = async (query: string) => {
  const { data, error } = await supabase
    .from('medicines')
    .select('*')
    .ilike('name', `%${query}%`);
  return { data, error };
};

// Message functions
export const sendMessage = async (messageData: any) => {
  const { data, error } = await supabase
    .from('messages')
    .insert([messageData]);
  return { data, error };
};

export const getUserMessages = async (userId: string) => {
  const { data, error } = await supabase
    .from('messages')
    .select('*, doctors(*)')
    .eq('user_id', userId);
  return { data, error };
};

// News functions
export const getNews = async () => {
  const { data, error } = await supabase
    .from('news')
    .select('*')
    .order('created_at', { ascending: false });
  return { data, error };
};

// Doctor profile functions (for doctor registration)
export const createDoctorProfile = async (profileData: any) => {
  const { data, error } = await supabase
    .from('doctor_profiles')
    .insert([profileData]);
  return { data, error };
};

export const getDoctorProfile = async (doctorId: string) => {
  const { data, error } = await supabase
    .from('doctor_profiles')
    .select('*')
    .eq('id', doctorId)
    .single();
  return { data, error };
};

export const updateDoctorProfile = async (doctorId: string, updates: any) => {
  const { data, error } = await supabase
    .from('doctor_profiles')
    .update(updates)
    .eq('id', doctorId);
  return { data, error };
};

// Video call functions
export const createVideoSession = async (sessionData: any) => {
  const { data, error } = await supabase
    .from('video_call_sessions')
    .insert([sessionData]);
  return { data, error };
};

export const getVideoSession = async (roomId: string) => {
  const { data, error } = await supabase
    .from('video_call_sessions')
    .select('*')
    .eq('room_id', roomId)
    .single();
  return { data, error };
};

export const updateVideoSession = async (sessionId: string, updates: any) => {
  const { data, error } = await supabase
    .from('video_call_sessions')
    .update(updates)
    .eq('id', sessionId);
  return { data, error };
};

// Enhanced appointment functions
export const getAppointmentWithVideoCall = async (appointmentId: string) => {
  const { data, error } = await supabase
    .from('appointments')
    .select(`
      *,
      doctors(*),
      appointment_video_calls(
        video_call_sessions(*)
      )
    `)
    .eq('id', appointmentId)
    .single();
  return { data, error };
};

// Medicine order functions
export const createMedicineOrder = async (orderData: any) => {
  const { data, error } = await supabase
    .from('medicine_orders')
    .insert([orderData]);
  return { data, error };
};

export const getUserMedicineOrders = async (userId: string) => {
  const { data, error } = await supabase
    .from('medicine_orders')
    .select('*, medicines(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  return { data, error };
};

// Enhanced medicine search
export const searchMedicinesAdvanced = async (query?: string, category?: string) => {
  const { data, error } = await supabase
    .rpc('search_medicines', {
      p_query: query,
      p_category: category
    });
  return { data, error };
};

// Doctor availability functions
export const getDoctorAvailability = async (doctorId: string) => {
  const { data, error } = await supabase
    .from('doctor_availability')
    .select('*')
    .eq('doctor_id', doctorId)
    .eq('is_available', true);
  return { data, error };
};

export const getAvailableDoctors = async (specialty?: string, city?: string, dayOfWeek?: number) => {
  const { data, error } = await supabase
    .rpc('get_available_doctors', {
      p_specialty: specialty,
      p_city: city,
      p_day_of_week: dayOfWeek
    });
  return { data, error };
};

// Consultation notes functions
export const createConsultationNote = async (noteData: any) => {
  const { data, error } = await supabase
    .from('consultation_notes')
    .insert([noteData]);
  return { data, error };
};

export const getConsultationNotes = async (patientId: string) => {
  const { data, error } = await supabase
    .from('consultation_notes')
    .select('*, doctor_profiles(name, specialty)')
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false });
  return { data, error };
};

// Prescription functions
export const createPrescription = async (prescriptionData: any) => {
  const { data, error } = await supabase
    .from('prescriptions')
    .insert([prescriptionData]);
  return { data, error };
};

export const getPatientPrescriptions = async (patientId: string) => {
  const { data, error } = await supabase
    .from('prescriptions')
    .select('*, doctor_profiles(name, specialty)')
    .eq('patient_id', patientId)
    .eq('is_active', true)
    .order('created_at', { ascending: false });
  return { data, error };
};

// Notification functions
export const getUserNotifications = async (userId: string) => {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  return { data, error };
};

export const markNotificationAsRead = async (notificationId: string) => {
  const { data, error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', notificationId);
  return { data, error };
};

// User preferences functions
export const getUserPreferences = async (userId: string) => {
  const { data, error } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', userId)
    .single();
  return { data, error };
};

export const updateUserPreferences = async (userId: string, preferences: any) => {
  const { data, error } = await supabase
    .from('user_preferences')
    .upsert({ user_id: userId, ...preferences });
  return { data, error };
};

