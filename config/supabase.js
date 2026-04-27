// ── Inicializa Supabase ───────────────────────────────────────
const SUPABASE_URL = 'https://fevgeitgmrmcbxqtxyyw.supabase.co'; // Tu URL
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZldmdlaXRnbXJtY2J4cXR4eXl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwNTYzMjcsImV4cCI6MjA5MjYzMjMyN30.oBygQByRsFpekJdutoGMHFGyDz8cpBi1qPx3Iv2c9kQ';               // Tu anon key
const supabase     = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);