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
      const { data } = await supabase.auth.getSession();
      
      if (data.session?.user) {
        set({ user: data.session.user });
        
        // Load user profile
        const { data: profileData } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.session.user.id)
          .single();
          
        if (profileData) {
          set({ profile: profileData });
        }
      } else {
        set({ user: null, profile: null });
      }
    } catch (error) {
      console.error('Error loading user:', error);
      set({ error: (error as Error).message });
    } finally {
      set({ loading: false });
    }
  },
  logout: async () => {
    await supabase.auth.signOut();
    set({ user: null, profile: null });
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