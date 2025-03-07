import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
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
import VideoCallFeature from './components/VideoCallPage'; // Import the new component

function App() {
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
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/appointments" element={<AppointmentBooking />} />
          <Route path="/medicines" element={<MedicineSearch />} />
          <Route path="/doctors" element={<BestDoctors />} />
          <Route path="/messages" element={<Messaging />} />
          <Route path="/video-consultation" element={<VideoCallFeature />} /> {/* Add this new route */}
        </Routes>
        
        <Footer />
        <Chatbot />
      </div>
    </Router>
  );
}

export default App;