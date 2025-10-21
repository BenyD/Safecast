import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

// Type aliases for easier use
export type User = Database['public']['Tables']['users']['Row']
export type Incident = Database['public']['Tables']['incidents']['Row']
export type CreateIncidentData = Omit<Database['public']['Tables']['incidents']['Insert'], 'id' | 'created_at' | 'expires_at' | 'is_verified' | 'verified_at' | 'verified_by' | 'status' | 'user_id'> & {
  location: {
    lat: number
    lng: number
  }
}
