import { create } from 'zustand';
import { supabase } from './supabase';

interface UserState {
  user: any | null;
  profile: any | null;
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
  loading: true,
  error: null,
  initialized: false,
  setUser: (user) => {
    console.log('Setting user:', user?.id);
    set({ user });
  },
  setProfile: (profile) => {
    console.log('Setting profile:', profile?.id);
    set({ profile });
  },
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  loadUser: async () => {
    const state = get();
    
    // Prevent multiple simultaneous loads
    if (state.loading && state.initialized) {
      console.log('Already loading user, skipping...');
      return;
    }

    try {
      console.log('Loading user...');
      set({ loading: true, error: null });
      
      // Get current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      console.log('Session result:', { 
        hasSession: !!session, 
        userId: session?.user?.id,
        error: sessionError 
      });
      
      if (sessionError) {
        console.error('Session error:', sessionError);
        set({ user: null, profile: null, initialized: true, loading: false });
        return;
      }
      
      if (!session?.user) {
        console.log('No session found');
        set({ user: null, profile: null, initialized: true, loading: false });
        return;
      }
      
      // Set user immediately
      set({ user: session.user });
      
      // Try to load profile (non-blocking)
      try {
        const { data: profileData, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();
        
        if (profileData) {
          console.log('Profile loaded:', profileData.id);
          set({ profile: profileData });
        } else if (profileError) {
          console.warn('Profile load error:', profileError);
        } else {
          console.warn('No profile found for user');
        }
      } catch (profileError) {
        console.warn('Profile load failed:', profileError);
      }
      
      set({ initialized: true, loading: false });
    } catch (error) {
      console.error('Fatal error loading user:', error);
      set({ 
        user: null, 
        profile: null, 
        error: error instanceof Error ? error.message : 'Unknown error',
        initialized: true,
        loading: false 
      });
    }
  },
  logout: async () => {
    try {
      console.log('Logging out...');
      set({ loading: true });
      
      await supabase.auth.signOut();
      
      // Clear all state
      set({ 
        user: null, 
        profile: null, 
        loading: false, 
        error: null,
        initialized: true
      });
      
      console.log('Logout complete');
    } catch (error) {
      console.error('Error during logout:', error);
      // Still clear state even if logout fails
      set({ 
        user: null, 
        profile: null, 
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