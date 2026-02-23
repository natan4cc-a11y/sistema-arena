import { createClient } from '@supabase/supabase-js'

// --- MODO DIRETO (Para testar sem erro) ---
// Cole sua Project URL dentro das aspas abaixo:
const supabaseUrl = 'https://hmfqaryaemubgqvnmrrz.supabase.co' 

// Cole sua API Key (anon public) dentro das aspas abaixo:
const supabaseAnonKey = 'sb_publishable_RguL-w6qcJNZGZEqAMrCgw_y_SgCFpj'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)