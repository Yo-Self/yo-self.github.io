import { createClient } from '@supabase/supabase-js'
import { getSupabasePublishableKey, getSupabaseUrl } from './config'

const supabaseUrl = getSupabaseUrl();
const supabaseKey = getSupabasePublishableKey();

// Só cria o cliente se as variáveis estiverem configuradas
export const supabase = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey)
  : null;
