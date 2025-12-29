import { create } from 'zustand';
import { supabase } from './supabase';

interface UserState {
  user: any | null;
  profile: any | null;
  loading: boolean;
  error: string | null;
  setUser: (user: any | null) => void;
  setProfile: (profile: any | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  loadUser: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  profile: null,
  loading: true,
  error: null,
  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  loadUser: async () => {
    try {
      set({ loading: true, error: null });
      
      // Force refresh session to avoid stale data
      const { data, error: sessionError } = await supabase.auth.refreshSession();
      
      if (sessionError) {
        console.warn('Session refresh failed:', sessionError);
        // Fallback to getSession if refresh fails
        const { data: fallbackData } = await supabase.auth.getSession();
        if (fallbackData.session?.user) {
          set({ user: fallbackData.session.user });
          await loadUserProfile(fallbackData.session.user.id);
        } else {
          set({ user: null, profile: null });
        }
      } else if (data.session?.user) {
        set({ user: data.session.user });
        await loadUserProfile(data.session.user.id);
      } else {
        set({ user: null, profile: null });
      }
    } catch (error) {
      console.error('Error loading user:', error);
      set({ error: (error as Error).message, user: null, profile: null });
    } finally {
      set({ loading: false });
    }
  },
  logout: async () => {
    try {
      await supabase.auth.signOut();
      // Clear all state immediately
      set({ user: null, profile: null, loading: false, error: null });
    } catch (error) {
      console.error('Error during logout:', error);
      // Still clear state even if logout fails
      set({ user: null, profile: null, loading: false, error: null });
    }
  }
}));

// Helper function to load user profile with error handling
const loadUserProfile = async (userId: string) => {
  try {
    // First try users table
    let { data: profileData, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
      
    if (error && error.code === 'PGRST116') {
      // Try profiles table as fallback
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
        
      if (fallbackError && fallbackError.code !== 'PGRST116') {
        console.error('Error loading profile from both tables:', fallbackError);
        return;
      }
      
      if (fallbackData) {
        // Transform profiles table data to match users table structure
        profileData = {
          id: fallbackData.id,
          full_name: fallbackData.name,
          email: fallbackData.email,
          phone: fallbackData.phone,
          city: fallbackData.city
        };
      }
    } else if (error) {
      console.error('Error loading profile:', error);
      return;
    }
    
    if (profileData) {
      useUserStore.getState().setProfile(profileData);
    }
  } catch (error) {
    console.error('Error in loadUserProfile:', error);
  }
};

interface AppointmentState {
  selectedDoctor: any | null;
  selectedDate: Date | null;
  selectedTime: string | null;
  duration: number;
  setSelectedDoctor: (doctor: any | null) => void;
  setSelectedDate: (date: Date | null) => void;
  setSelectedTime: (time: string | null) => void;
  setDuration: (duration: number) => void;
  resetAppointment: () => void;
}

export const useAppointmentStore = create<AppointmentState>((set) => ({
  selectedDoctor: null,
  selectedDate: null,
  selectedTime: null,
  duration: 30,
  setSelectedDoctor: (doctor) => set({ selectedDoctor: doctor }),
  setSelectedDate: (date) => set({ selectedDate: date }),
  setSelectedTime: (time) => set({ selectedTime: time }),
  setDuration: (duration) => set({ duration }),
  resetAppointment: () => set({
    selectedDoctor: null,
    selectedDate: null,
    selectedTime: null,
    duration: 30
  })
}));