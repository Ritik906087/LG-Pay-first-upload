'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/utils';
import type { User } from '@supabase/supabase-js';

// Define a type for the user profile, mirroring the table structure
type UserProfile = {
  id: string;
  numeric_id: string;
  email?: string;
  phone_number?: string;
  display_name?: string;
  photo_url?: string;
  balance: number;
  hold_balance: number;
  created_at: string;
  inviter_uid?: string;
  claimed_user_rewards?: string[];
  payment_methods?: any[];
  session_id?: string;
};

const supabase = createClient();

export function useSupabaseUser() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      
      if (currentUser) {
        const { data: userProfile, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', currentUser.id)
          .single();
          
        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching user profile:', error);
          setProfile(null);
        } else {
          setProfile(userProfile);
        }
      } else {
        setProfile(null);
      }
      
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return { user, profile, loading };
}
