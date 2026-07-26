import { createClient } from '@supabase/supabase-js'

//const supabaseUrl = "https://isvgfizuognrlfdbdieb.supabase.co"

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

//const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlzdmdmaXp1b2ducmxmZGJkaWViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzMzM2NzUsImV4cCI6MjA5NjkwOTY3NX0.oR5skLCQqbQNlgyGlqbyWDFxnSDbzFoL7gkfcc-7zUc"

const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey)
