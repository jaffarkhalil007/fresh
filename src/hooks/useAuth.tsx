import { createContext, useContext, ReactNode, useEffect, useState } from 'react';
import { useUser, useAuth as useClerkAuth, useSignIn, useSignUp } from '@clerk/clerk-react';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: any | null; // Loosely typed transformed Clerk user
  session: any | null;
  loading: boolean;
  isAdmin: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { user: clerkUser, isLoaded: userLoaded } = useUser();
  const { signOut: clerkSignOut, getToken, isLoaded: authLoaded } = useClerkAuth();
  const { signIn: clerkSignIn } = useSignIn();
  const { signUp: clerkSignUp } = useSignUp();
  
  // Transform Clerk user to look like Supabase User for backward compatibility
  const user = clerkUser ? {
    ...clerkUser,
    id: clerkUser.id,
    email: clerkUser.primaryEmailAddress?.emailAddress,
    user_metadata: {
      full_name: clerkUser.fullName
    }
  } : null;

  const [isAdmin, setIsAdmin] = useState(false);
  const [isAdminLoading, setIsAdminLoading] = useState(true);
  
  const loading = !userLoaded || !authLoaded || isAdminLoading;

  useEffect(() => {
    if (user) {
      const checkAdmin = async () => {
        try {
          const userEmail = user.email;
          
          if (import.meta.env.VITE_ADMIN_EMAIL && userEmail === import.meta.env.VITE_ADMIN_EMAIL) {
            setIsAdmin(true);
            return;
          }

          const { data, error } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', user.id)
            .eq('role', 'admin')
            .maybeSingle();

          if (error) throw error;

          if (data) {
            setIsAdmin(true);
          } else {
            setIsAdmin(false);
          }
        } catch (error) {
          console.error("Error verifying admin role:", error);
          setIsAdmin(false);
        } finally {
          setIsAdminLoading(false);
        }
      };

      checkAdmin();
    } else {
      setIsAdmin(false);
      if (userLoaded && authLoaded) {
        setIsAdminLoading(false);
      }
    }
  }, [user, userLoaded, authLoaded]);

  const signUp = async (email: string, password: string, fullName: string) => {
    if (!clerkSignUp) return { error: new Error('Clerk not loaded') };
    try {
      const parts = fullName.split(' ');
      const res = await clerkSignUp.create({
        emailAddress: email,
        password,
        firstName: parts[0] || '',
        lastName: parts.slice(1).join(' ') || ''
      });
      if (res.status === 'complete') return { error: null };
      return { error: new Error('Verification required (check email)') };
    } catch (err: any) {
      return { error: err };
    }
  };

  const signIn = async (email: string, password: string) => {
    if (!clerkSignIn) return { error: new Error('Clerk not loaded') };
    try {
      const res = await clerkSignIn.create({
        identifier: email,
        password,
      });
      return { error: null };
    } catch (err: any) {
      return { error: err };
    }
  };

  const signOut = async () => {
    if (clerkSignOut) await clerkSignOut();
  };

  return (
    <AuthContext.Provider value={{ user, session: null, loading, isAdmin, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
