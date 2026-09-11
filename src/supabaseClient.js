import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ojhminrrkkxwyybpgvrs.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qaG1pbnJya2t4d3l5YnBndnJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA3Mzg3NjAsImV4cCI6MjA5NjMxNDc2MH0.FLjwzsaUIFddBocTxR9MgZKT8Tmp2ul0A0FYXPSh5EQ';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseAnonKey.includes('PASTE_YOUR_ANON_KEY_HERE')
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      }
    })
  : null;
