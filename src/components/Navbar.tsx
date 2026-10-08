import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, User, LogOut, Home, Calendar, MessageSquare, Pill, Search, Video, ShieldCheck } from 'lucide-react';
import { useUserStore } from '../lib/store';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase'; // Import supabase client

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user, logout, setUser, loadUser, isAdmin } = useUserStore();
  const location = useLocation();

  // Check for session on component mount and page refresh
  useEffect(() => {
    const checkSession = async () => {
      console.log('Navbar checking session...');
      setLoading(true);
      await loadUser();
      setLoading(false);
      console.log('Navbar session check complete, user:', useUserStore.getState().user?.id || 'null');
    };
    
    checkSession();
  }, [loadUser]);

  // Subscribe to user state changes
  useEffect(() => {
    console.log('Navbar: User state changed. User ID:', user?.id || 'null', 'Loading:', loading);
  }, [user, loading]);

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

  const isHome = location.pathname === '/';
  const showSolidNav = !isHome || scrolled;

  return (
    <nav 
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-200 ${
        showSolidNav 
          ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-200' 
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
          <div className="hidden md:flex md:items-center md:space-x-3">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-3 py-2 rounded-md text-sm font-medium flex items-center space-x-1 transition-colors ${
                  location.pathname === link.path
                    ? 'text-white bg-gradient-to-r from-red-600 via-pink-500 to-orange-500 shadow-xs'
                    : 'text-gray-700 hover:bg-red-50 hover:text-red-600'
                }`}
              >
                {link.icon}
                <span>{link.name}</span>
              </Link>
            ))}

            {/* Admin link for administrators or accessible route */}
            {(isAdmin || (user && user.email?.includes('admin'))) && (
              <Link
                to="/admin"
                className={`px-3 py-2 rounded-md text-sm font-semibold flex items-center space-x-1 transition-colors ${
                  location.pathname === '/admin'
                    ? 'bg-red-600 text-white'
                    : 'text-red-700 bg-red-50 hover:bg-red-100 border border-red-200'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Admin</span>
              </Link>
            )}
            
            {loading ? (
              // Loading state
              <div className="ml-2 h-9 w-20 bg-gray-100 animate-pulse rounded-md"></div>
            ) : user ? (
              <div className="ml-2 flex items-center space-x-2">
                <Link
                  to="/profile"
                  className="px-3 py-2 rounded-md text-sm font-medium flex items-center space-x-1 text-gray-700 hover:bg-red-50 hover:text-red-600"
                >
                  <User className="w-5 h-5" />
                  <span>Profile</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="px-3 py-2 rounded-md text-sm font-medium flex items-center space-x-1 text-gray-700 hover:bg-red-50 hover:text-red-600"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <div className="ml-2 flex items-center space-x-2">
                <Link
                  to="/login"
                  className="px-3.5 py-1.5 rounded-md text-sm font-medium border border-red-500 text-red-600 hover:bg-red-50"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="px-3.5 py-1.5 rounded-md text-sm font-medium text-white bg-gradient-to-r from-red-600 via-pink-500 to-orange-500 hover:opacity-90"
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
              {(isAdmin || user.email?.includes('admin')) && (
                <Link
                  to="/admin"
                  onClick={closeMenu}
                  className="block px-3 py-2 rounded-md text-base font-semibold flex items-center space-x-2 text-red-700 bg-red-50 hover:bg-red-100"
                >
                  <ShieldCheck className="w-5 h-5 text-red-600" />
                  <span>Admin Panel</span>
                </Link>
              )}
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