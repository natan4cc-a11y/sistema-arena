import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://hmfqaryaemubgqvnmrrz.supabase.co' 

const supabaseAnonKey = 'sb_publishable_RguL-w6qcJNZGZEqAMrCgw_y_SgCFpj'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)