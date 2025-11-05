import { createClient } from '@supabase/supabase-js';

// Remplace par tes propres valeurs (trouvables dans Supabase > Settings > API)
const SUPABASE_URL = 'https://smpwmwlhzzitjygbjztb.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNtcHdtd2xoenppdGp5Z2JqenRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAyNzQzMDUsImV4cCI6MjA1NTg1MDMwNX0.Ka26O2rXWAyaeV47cYH9JL3R7sWNi93cwDS4k9p6VJM';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
