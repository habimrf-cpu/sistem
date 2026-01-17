import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fwdsduxprgybnwgbvwtg.supabase.co';
// Anon key is safe to expose on frontend as we use RLS
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3ZHNkdXhwcmd5Ym53Z2J2d3RnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg2Mjk2MTEsImV4cCI6MjA4NDIwNTYxMX0.Vtamd5AFVrMzQ--t5NUUiV0mXmz2-qcUQG6LjJtSaiM';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);