import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Auth functions
export const signUp = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
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
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  return { data, error };
};

export const updateUserProfile = async (userId: string, updates: any) => {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId);
  return { data, error };
};

// Doctor functions
export const getDoctors = async () => {
  const { data, error } = await supabase
    .from('doctors')
    .select('*');
  return { data, error };
};

export const getDoctorsByCity = async (city: string) => {
  const { data, error } = await supabase
    .from('doctors')
    .select('*')
    .eq('city', city);
  return { data, error };
};

export const getDoctorById = async (id: string) => {
  const { data, error } = await supabase
    .from('doctors')
    .select('*')
    .eq('id', id)
    .single();
  return { data, error };
};

// Appointment functions
export const createAppointment = async (appointmentData: any) => {
  const { data, error } = await supabase
    .from('appointments')
    .insert([appointmentData]);
  return { data, error };
};

export const getUserAppointments = async (userId: string) => {
  const { data, error } = await supabase
    .from('appointments')
    .select('*, doctors(*)')
    .eq('user_id', userId);
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

