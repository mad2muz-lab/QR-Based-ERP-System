export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          username: string
          role: 'developer' | 'admin' | 'manager' | 'operator' | 'viewer'
          name: string
          email: string | null
          site: string | null
          created_at: string
          last_login: string | null
        }
        Insert: {
          id?: string
          username: string
          role?: 'developer' | 'admin' | 'manager' | 'operator' | 'viewer'
          name: string
          email?: string | null
          site?: string | null
          created_at?: string
          last_login?: string | null
        }
        Update: {
          id?: string
          username?: string
          role?: 'developer' | 'admin' | 'manager' | 'operator' | 'viewer'
          name?: string
          email?: string | null
          site?: string | null
          created_at?: string
          last_login?: string | null
        }
      }
      // Add other tables (employees, equipment, materials, sites, etc.) here
    }
  }
}