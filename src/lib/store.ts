import { create } from 'zustand';
import { supabase } from './supabase';

interface UserState {
  user: any | null;
  profile: any | null;
  role: 'patient' | 'doctor' | 'admin';
  isAdmin: boolean;
  isDoctor: boolean;
  loading: boolean;
  error: string | null;
  initialized: boolean;
  setUser: (user: any | null) => void;
  setProfile: (profile: any | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  loadUser: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useUserStore = create<UserState>((set, get) => ({
  user: null,
  profile: null,
  role: 'patient',
  isAdmin: false,
  isDoctor: false,
  loading: true,
  error: null,
  initialized: false,
  setUser: (user) => {
    set({ user });
  },
  setProfile: (profile) => {
    set({ profile });
  },
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  loadUser: async () => {
    const state = get();
    
    if (state.loading && state.initialized) {
      return;
    }

    try {
      set({ loading: true, error: null });
      
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session?.user) {
        set({ 
          user: null, 
          profile: null, 
          role: 'patient',
          isAdmin: false,
          isDoctor: false,
          initialized: true, 
          loading: false 
        });
        return;
      }
      
      const user = session.user;
      let role: 'patient' | 'doctor' | 'admin' = (user.user_metadata?.role as any) || 'patient';
      let isAdmin = role === 'admin' || user.email?.toLowerCase().includes('admin') || false;
      let isDoctor = role === 'doctor';

      // Load profile from users table
      let profileData = null;
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();
        
        if (data) {
          profileData = data;
        }
      } catch (err) {
        console.warn('Profile load from users table failed:', err);
      }

      // Check profiles table for is_admin flag if not already identified
      if (!isAdmin) {
        try {
          const { data: pData } = await supabase
            .from('profiles')
            .select('is_admin')
            .eq('id', user.id)
            .maybeSingle();
          if (pData?.is_admin) {
            isAdmin = true;
            role = 'admin';
          }
        } catch {
          // Ignore
        }
      }

      // Check doctor_profiles table if not already identified as doctor
      if (!isDoctor && !isAdmin) {
        try {
          const { data: dData } = await supabase
            .from('doctor_profiles')
            .select('id')
            .eq('user_id', user.id)
            .maybeSingle();
          if (dData) {
            isDoctor = true;
            role = 'doctor';
          }
        } catch {
          // Ignore
        }
      }

      set({ 
        user, 
        profile: profileData, 
        role,
        isAdmin,
        isDoctor,
        initialized: true, 
        loading: false 
      });
    } catch (error) {
      console.error('Fatal error loading user:', error);
      set({ 
        user: null, 
        profile: null, 
        role: 'patient',
        isAdmin: false,
        isDoctor: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        initialized: true, 
        loading: false 
      });
    }
  },
  logout: async () => {
    try {
      set({ loading: true });
      await supabase.auth.signOut();
      set({ 
        user: null, 
        profile: null, 
        role: 'patient',
        isAdmin: false,
        isDoctor: false,
        loading: false, 
        error: null,
        initialized: true
      });
    } catch (error) {
      console.error('Error during logout:', error);
      set({ 
        user: null, 
        profile: null, 
        role: 'patient',
        isAdmin: false,
        isDoctor: false,
        loading: false, 
        error: null,
        initialized: true
      });
    }
  }
}));

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