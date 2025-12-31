import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  signUp: (username: string, password: string) => Promise<{ error?: string }>;
  signIn: (username: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  checkUsernameAvailable: (username: string) => Promise<boolean>;
  forceStopLoading: () => void;
  retryAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const initializeAuth = async () => {
    console.log('[Auth] Initializing authentication...');
    setError(null);

    try {
      // Check for cached profile first - instant load
      const cachedProfile = localStorage.getItem('user_profile');
      if (cachedProfile) {
        try {
          const parsed = JSON.parse(cachedProfile);
          console.log('[Auth] Using cached profile, loading app immediately');
          setUser(parsed);
          setLoading(false); // STOP LOADING IMMEDIATELY
        } catch (e) {
          console.warn('[Auth] Invalid cached profile, removing');
          localStorage.removeItem('user_profile');
        }
      }

      // Get session (non-blocking)
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        console.error('[Auth] Session error:', sessionError);
        setError('Session check failed');
        setLoading(false);
        return;
      }

      if (session?.user) {
        // Fetch profile in background (don't block app)
        fetchUserProfile(session.user.id, true); // true = background mode
      } else {
        // No session, clear cache and stop loading
        localStorage.removeItem('user_profile');
        setUser(null);
        setLoading(false);
      }
    } catch (err: any) {
      console.error('[Auth] Initialization error:', err);
      setError(err.message || 'Failed to initialize');
      setLoading(false);
    }
  };

  useEffect(() => {
    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.log('[Auth] Auth state changed:', _event);
      if (session?.user) {
        // Check if we have cached profile - if so, use it immediately
        const cachedProfile = localStorage.getItem('user_profile');
        if (cachedProfile) {
          try {
            setUser(JSON.parse(cachedProfile));
            setLoading(false); // Stop loading immediately with cached data
            // Fetch fresh profile in background to update cache
            await fetchUserProfile(session.user.id, true);
          } catch (e) {
            console.warn('[Auth] Invalid cached profile in auth change');
            // No cache, fetch in blocking mode
            await fetchUserProfile(session.user.id, false);
          }
        } else {
          // No cache exists, fetch in blocking mode (first login)
          console.log('[Auth] No cached profile, fetching in blocking mode');
          await fetchUserProfile(session.user.id, false);
        }
      } else {
        setUser(null);
        setLoading(false);
        localStorage.removeItem('user_profile');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchUserProfile(userId: string, background: boolean = false) {
    const startTime = Date.now();
    try {
      if (!background) {
        console.log('[Auth] Fetching profile (blocking mode)...');
        setLoading(true);
      } else {
        console.log('[Auth] Fetching profile (background mode)...');
      }

      // SIMPLIFIED: Only fetch core fields for speed
      console.log('[Auth] Fetching core profile fields only');
      const profilePromise = supabase
        .from('profiles')
        .select('id, username, age, location, bio, created_at, updated_at')
        .eq('id', userId)
        .single();

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => {
          console.error('[Auth] ⚠️ TIMEOUT: Profile fetch took more than 8 seconds');
          reject(new Error('Profile fetch timeout after 8s'));
        }, 8000)
      );

      const { data, error } = await Promise.race([profilePromise, timeoutPromise]);

      const elapsed = Date.now() - startTime;
      console.log(`[Auth] ✅ Profile fetch completed in ${elapsed}ms`);

      if (error) {
        console.error('[Auth] ❌ Profile fetch error:', error);
        setError(`Failed to load profile: ${error.message}`);
        setLoading(false);
        return;
      }

      if (!data) {
        console.error('[Auth] ❌ No profile data returned');
        setError('Profile not found');
        setLoading(false);
        return;
      }

      // Cache profile and update state
      console.log('[Auth] 💾 Caching profile for user:', data.username);
      localStorage.setItem('user_profile', JSON.stringify(data));
      setUser(data);
      setError(null);
      setLoading(false);
      console.log('[Auth] ✅ Login complete, loading stopped');
    } catch (err: any) {
      const elapsed = Date.now() - startTime;
      console.error(`[Auth] ❌ Exception after ${elapsed}ms:`, err.message);
      setError(err.message || 'Profile fetch failed');
      setLoading(false);
    }
  }

  async function checkUsernameAvailable(username: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .rpc('check_username_available', { username_to_check: username });

      if (error) throw error;
      return data === true;
    } catch (error) {
      console.error('Error checking username:', error);
      return false;
    }
  }

  async function signUp(username: string, password: string): Promise<{ error?: string }> {
    try {
      // Create fake email from username
      const email = `${username}@creepz.local`;

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username
          }
        }
      });

      if (error) throw error;

      if (data.user) {
        // Use server-side function to create profile (bypasses RLS)
        const { error: profileError } = await supabase
          .rpc('create_profile', {
            user_id: data.user.id,
            user_name: username
          });

        if (profileError) {
          console.error('Profile creation error:', profileError);
          throw new Error(`Failed to create profile: ${profileError.message}`);
        }

        // Small delay to ensure profile is committed
        await new Promise(resolve => setTimeout(resolve, 100));

        // Auth state change will handle profile fetch
        console.log('[Auth] Sign up successful, auth state change will handle profile');
      }

      return {};
    } catch (error: any) {
      console.error('Sign up error:', error);
      return { error: error.message || 'Failed to create account' };
    }
  }

  async function signIn(username: string, password: string): Promise<{ error?: string }> {
    try {
      const email = `${username}@creepz.local`;

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Auth state change listener will handle profile fetch
      console.log('[Auth] Sign in successful, auth state change will handle profile');

      return {};
    } catch (error: any) {
      console.error('Sign in error:', error);
      return { error: 'Invalid username or password' };
    }
  }

  async function signOut() {
    try {
      await supabase.auth.signOut();
      localStorage.removeItem('user_profile'); // Clear cache
      setUser(null);
      setError(null);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  }

  function forceStopLoading() {
    console.log('Force stopping loading state');
    setLoading(false);
    setError('Loading was manually stopped');
  }

  async function retryAuth() {
    console.log('Retrying authentication');
    await initializeAuth();
  }

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      error,
      signUp,
      signIn,
      signOut,
      checkUsernameAvailable,
      forceStopLoading,
      retryAuth
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
