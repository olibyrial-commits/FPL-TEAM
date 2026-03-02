import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Create mock client if environment variables are not set
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : ({
      from: () => ({
        select: () => ({
          eq: () => ({
            single: async () => ({ data: null, error: new Error('Supabase not configured') }),
          }),
        }),
        update: () => ({
          eq: () => ({
            select: () => ({
              single: async () => ({ data: null, error: new Error('Supabase not configured') }),
            }),
          }),
        }),
      }),
      rpc: () => ({
        error: new Error('Supabase not configured'),
      }),
    } as any);

export type Profile = {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  subscription_tier: 'free' | 'pro' | 'enterprise';
  optimizations_used: number;
  optimizations_limit: number;
  created_at: string;
  updated_at: string;
};

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('[Supabase] Error fetching profile:', error);
    return null;
  }

  return data as Profile;
}

export async function updateProfile(
  userId: string,
  updates: Partial<Profile>
): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    console.error('[Supabase] Error updating profile:', error);
    return null;
  }

  return data as Profile;
}

export async function incrementOptimizations(userId: string): Promise<boolean> {
  const { error } = await supabase.rpc('increment_optimizations', {
    user_id: userId,
  });

  if (error) {
    console.error('[Supabase] Error incrementing optimizations:', error);
    return false;
  }

  return true;
}

export async function canOptimize(userId: string): Promise<boolean> {
  const profile = await getProfile(userId);
  if (!profile) return false;

  return profile.optimizations_used < profile.optimizations_limit;
}
