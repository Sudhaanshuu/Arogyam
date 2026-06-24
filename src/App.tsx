import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useUserStore } from './lib/store';
import { supabase } from './lib/supabase';
import './lib/authDebug'; // Import auth debug utilities
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import ServiceCards from './components/ServiceCards';
import MedicineSearch from './components/MedicineSearch';
import BestDoctors from './components/BestDoctors';
import AppointmentBooking from './components/AppointmentBooking';
import NewsSlider from './components/NewsSlider';
import Messaging from './components/Messaging';
import Chatbot from './components/Chatbot';
import ContactUs from './components/ContactUs';
import Footer from './components/Footer';
import Login from './components/Login';
import Signup from './components/Signup';
import Profile from './components/Profile';
import VerifyEmail from './components/VerifyEmail';
import DoctorRegistration from './components/DoctorRegistration';
import VideoCallFeature from './components/VideoCallPage'; 

function App() {
  const { loadUser, setUser, setProfile, setLoading } = useUserStore();

  useEffect(() => {
    console.log('App initializing...');
    
    // Load initial session
    loadUser();
    
    // Set up auth state listener
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session?.user?.id);
      
      if (event === 'SIGNED_IN') {
        console.log('User signed in, reloading user data');
        loadUser();
      } else if (event === 'SIGNED_OUT') {
        console.log('User signed out, clearing state');
        setUser(null);
        setProfile(null);
        setLoading(false);
      } else if (event === 'TOKEN_REFRESHED') {
        console.log('Token refreshed, updating user');
        if (session?.user) {
          setUser(session.user);
        }
      } else if (event === 'USER_UPDATED') {
        console.log('User updated, reloading');
        loadUser();
      }
    });
    
    // Cleanup
    return () => {
      console.log('App unmounting, cleaning up auth listener');
      authListener.subscription.unsubscribe();
    };
  }, []);

  return (
    <Router>
      <div className="min-h-screen bg-white">
        <Toaster position="top-right" />
        <Navbar />
        
        <Routes>
          <Route path="/" element={
            <>
              <Hero />
              <ServiceCards />
              <MedicineSearch />
              <BestDoctors />
              <NewsSlider />
              <ContactUs />
            </>
          } />
          <Route path="/doctor-registration" element={<DoctorRegistration />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/appointments" element={<AppointmentBooking />} />
          <Route path="/medicines" element={<MedicineSearch />} />
          <Route path="/doctors" element={<BestDoctors />} />
          <Route path="/messages" element={<Messaging />} />
          <Route path="/video-consultation" element={<VideoCallFeature />} />
          <Route path="/reset-password" element={<Login />} />
        </Routes>
        
        <Footer />
        <Chatbot />
      </div>
    </Router>
  );
}

export default App;