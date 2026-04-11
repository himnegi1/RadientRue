import { createClient } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage'

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || ''

export const supabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY)

if (!supabaseConfigured) {
  console.warn(
    '[supabase] Missing EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY — ' +
    'auth and data calls will fail. Check eas.json env or .env.'
  )
}

// Fall back to placeholder values when unconfigured so createClient doesn't
// throw at module-load time and crash the entire app on launch.
export const supabase = createClient(
  SUPABASE_URL || 'https://placeholder.supabase.co',
  SUPABASE_ANON_KEY || 'placeholder-anon-key',
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
)
