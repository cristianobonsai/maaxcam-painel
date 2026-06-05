import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://qtvrzdwgfeomzahtjwpz.supabase.co'
const supabaseKey = 'sb_publishable_B0VvBMcbvMJzYYlg4FnWjw_mzsl4njM'

export const supabase = createClient(supabaseUrl, supabaseKey)
