import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qmxzbpnuhrywzhlxbqnp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFteHpicG51aHJ5d3pobHhicW5wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzMTQzOTgsImV4cCI6MjA3MDg5MDM5OH0.YGDSIhwymYBGpebkpfode52emZDWjB5CggdGOSLnVa4';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
