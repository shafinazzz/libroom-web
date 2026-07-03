/* ============================================
   Supabase Client (shared)
   Padanan dengan Supabase.initialize() dalam main.dart
   ============================================ */

const SUPABASE_URL = 'https://apphzutlvynvpfedotwu.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_QbCmqts5cMyWVZz0Ij__2Q_u3WONY2B';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);