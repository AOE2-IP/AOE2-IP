import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://pwxflwedfpzzahlyiqsg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB3eGZsd2VkZnB6emFobHlpcXNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMxNjg4OTIsImV4cCI6MjEwODc0NDg5Mn0.5uD6ELJlNjUV4jGkU_chxcK1_EOjmBcVIZS71pUU5zg';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);