// Auth debugging utilities
import { supabase } from './supabase';

/**
 * Clear all authentication data from localStorage
 * Use this if you're experiencing persistent login issues
 */
export const clearAuthCache = () => {
  try {
    // Clear all supabase auth keys
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('sb-')) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    console.log('Cleared auth cache:', keysToRemove.length, 'items removed');
    return true;
  } catch (error) {
    console.error('Failed to clear auth cache:', error);
    return false;
  }
};

/**
 * Check current session status
 */
export const debugSession = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    console.log('=== Session Debug Info ===');
    console.log('Session exists:', !!session);
    console.log('User ID:', session?.user?.id);
    console.log('User email:', session?.user?.email);
    console.log('Expires at:', session?.expires_at ? new Date(session.expires_at * 1000) : 'N/A');
    console.log('Error:', error);
    
    return { session, error };
  } catch (error) {
    console.error('Failed to debug session:', error);
    return { session: null, error };
  }
};

/**
 * Force sign out and clear all auth data
 */
export const forceSignOut = async () => {
  try {
    await supabase.auth.signOut();
    clearAuthCache();
    window.location.reload();
  } catch (error) {
    console.error('Force sign out failed:', error);
    // Clear cache anyway
    clearAuthCache();
    window.location.reload();
  }
};

// Make utilities available in console for debugging
if (typeof window !== 'undefined') {
  (window as any).authDebug = {
    clearAuthCache,
    debugSession,
    forceSignOut
  };
  
  console.log('Auth debug utilities available: window.authDebug');
}
