import { createClient } from '@supabase/supabase-js';

// 直接填入你的 Supabase 資料
const SUPABASE_URL = 'https://pwxflwedfpzzahlyiqsg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB3eGZsd2VkZnB6emFobHlpcXNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg4NTY5NTksImV4cCI6MjA1NDQzMjk1OX0.這裡貼上你完整的anon_key長字串';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);