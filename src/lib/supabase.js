import { createClient } from '@supabase/supabase-js'

// ⚠️ CONFIGURACIÓN: Reemplaza con tus credenciales de Supabase
// Las puedes encontrar en: https://app.supabase.com → tu proyecto → Settings → API
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://TU-PROYECTO.supabase.co'
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'TU-ANON-KEY'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
