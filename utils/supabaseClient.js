import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  fetch: fetch.bind(globalThis),
  persistSession: true,
  autoRefreshToken: true,
  global: {
    fetch: {
      headers: { 
        'Cache-Control': 'no-store, max-age=0'
      },
    },
  },
}) 