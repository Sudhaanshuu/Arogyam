import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, User, LogOut, Home, Calendar, MessageSquare, Pill, Search,Video } from 'lucide-react';
import { useUserStore } from '../lib/store';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase'; // Import supabase client

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user, logout, setUser, loadUser } = useUserStore();
  const location = useLocation();

  // Check for session on component mount and page refresh
  useEffect(() => {
    const checkSession = async () => {
      setLoading(true);
      await loadUser();
      setLoading(false);
    };
    
    checkSession();
  }, [loadUser]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  const handleLogout = async () => {
    await logout();
    closeMenu();
  };

  const navLinks = [
    { name: 'Home', path: '/', icon: <Home className="w-5 h-5" /> },
    { name: 'Appointments', path: '/appointments', icon: <Calendar className="w-5 h-5" /> },
    { name: 'Medicines', path: '/medicines', icon: <Pill className="w-5 h-5" /> },
    { name: 'Messages', path: '/messages', icon: <MessageSquare className="w-5 h-5" /> },
    { name: 'Find Doctors', path: '/doctors', icon: <Search className="w-5 h-5" /> },
    { name: 'Video Call', path: '/video-consultation', icon: <Video className="w-5 h-5" /> },
  ];

  return (
    <nav 
      className={`fixed w-full z-50 transition-all duration-300 ${
        scrolled 
          ? 'bg-white/90 backdrop-blur-md shadow-lg' 
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="flex items-center"
              >
                <span className="text-2xl font-bold bg-gradient-to-r from-red-600 via-pink-500 to-orange-500 text-transparent bg-clip-text">
                  Arogyam Kiosk
                </span>
              </motion.div>
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:space-x-4">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-3 py-2 rounded-md text-sm font-medium flex items-center space-x-1 transition-colors ${
                  location.pathname === link.path
                    ? 'text-white bg-gradient-to-r from-red-600 via-pink-500 to-orange-500'
                    : 'text-gray-700 hover:bg-red-50 hover:text-red-600'
                }`}
              >
                {link.icon}
                <span>{link.name}</span>
              </Link>
            ))}
            
            {loading ? (
              // Optional loading state
              <div className="ml-4 h-10 w-20 bg-gray-100 animate-pulse rounded-md"></div>
            ) : user ? (
              <div className="ml-4 flex items-center">
                <Link
                  to="/profile"
                  className="px-3 py-2 rounded-md text-sm font-medium flex items-center space-x-1 text-gray-700 hover:bg-red-50 hover:text-red-600"
                >
                  <User className="w-5 h-5" />
                  <span>Profile</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="ml-2 px-3 py-2 rounded-md text-sm font-medium flex items-center space-x-1 text-gray-700 hover:bg-red-50 hover:text-red-600"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <div className="ml-4 flex items-center space-x-2">
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-md text-sm font-medium border border-red-500 text-red-600 hover:bg-red-50"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="px-4 py-2 rounded-md text-sm font-medium text-white bg-gradient-to-r from-red-600 via-pink-500 to-orange-500 hover:opacity-90"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
          
          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-red-600 hover:bg-red-50 focus:outline-none"
            >
              {isOpen ? (
                <X className="block h-6 w-6" />
              ) : (
                <Menu className="block h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <motion.div 
        className={`md:hidden ${isOpen ? 'block' : 'hidden'}`}
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: isOpen ? 1 : 0, height: isOpen ? 'auto' : 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white shadow-lg">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={closeMenu}
              className={`block px-3 py-2 rounded-md text-base font-medium flex items-center space-x-2 ${
                location.pathname === link.path
                  ? 'text-white bg-gradient-to-r from-red-600 via-pink-500 to-orange-500'
                  : 'text-gray-700 hover:bg-red-50 hover:text-red-600'
              }`}
            >
              {link.icon}
              <span>{link.name}</span>
            </Link>
          ))}
          
          {loading ? (
            // Optional loading state for mobile
            <div className="h-10 w-full bg-gray-100 animate-pulse rounded-md my-2"></div>
          ) : user ? (
            <>
              <Link
                to="/profile"
                onClick={closeMenu}
                className="block px-3 py-2 rounded-md text-base font-medium flex items-center space-x-2 text-gray-700 hover:bg-red-50 hover:text-red-600"
              >
                <User className="w-5 h-5" />
                <span>Profile</span>
              </Link>
              <button
                onClick={handleLogout}
                className="w-full text-left block px-3 py-2 rounded-md text-base font-medium flex items-center space-x-2 text-gray-700 hover:bg-red-50 hover:text-red-600"
              >
                <LogOut className="w-5 h-5" />
                <span>Logout</span>
              </button>
            </>
          ) : (
            <div className="pt-4 pb-3 border-t border-gray-200">
              <div className="flex items-center px-5">
                <div className="flex-shrink-0">
                  <User className="h-10 w-10 rounded-full text-gray-400" />
                </div>
                <div className="ml-3">
                  <div className="text-base font-medium text-gray-800">Guest User</div>
                  <div className="text-sm font-medium text-gray-500">Not logged in</div>
                </div>
              </div>
              <div className="mt-3 space-y-1 px-2">
                <Link
                  to="/login"
                  onClick={closeMenu}
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-red-50 hover:text-red-600"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  onClick={closeMenu}
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-red-50 hover:text-red-600"
                >
                  Sign Up
                </Link>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </nav>
  );
};

export default Navbar;