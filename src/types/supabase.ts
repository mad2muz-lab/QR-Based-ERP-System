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
      employee_logs: {
        Row: {
          id: string
          employee_id: string
          employee_name: string
          department: string
          site: string
          action: 'clock-in' | 'clock-out'
          date: string
          time: string
          timestamp: string
          notes: string | null
          location: string | null
          old_id: string | null
          regular_hours: number | null
          overtime_hours: number | null
          total_work_hours: number | null
        }
        Insert: {
          id?: string
          employee_id: string
          employee_name: string
          department: string
          site: string
          action: 'clock-in' | 'clock-out'
          date?: string
          time?: string
          timestamp?: string
          notes?: string | null
          location?: string | null
          old_id?: string | null
          regular_hours?: number | null
          overtime_hours?: number | null
          total_work_hours?: number | null
        }
        Update: {
          id?: string
          employee_id?: string
          employee_name?: string
          department?: string
          site?: string
          action?: 'clock-in' | 'clock-out'
          date?: string
          time?: string
          timestamp?: string
          notes?: string | null
          location?: string | null
          old_id?: string | null
          regular_hours?: number | null
          overtime_hours?: number | null
          total_work_hours?: number | null
        }
      }
      equipment_logs: {
        Row: {
          id: string
          equipment_id: string
          equipment_name: string
          equipment_type: string
          action: 'start-use' | 'stop-use'
          date: string
          time: string
          timestamp: string
          site: string
          status: string
          notes: string | null
          location: string | null
          old_id: string | null
        }
        Insert: {
          id?: string
          equipment_id: string
          equipment_name: string
          equipment_type: string
          action: 'start-use' | 'stop-use'
          date?: string
          time?: string
          timestamp?: string
          site: string
          status: string
          notes?: string | null
          location?: string | null
          old_id?: string | null
        }
        Update: {
          id?: string
          equipment_id?: string
          equipment_name?: string
          equipment_type?: string
          action?: 'start-use' | 'stop-use'
          date?: string
          time?: string
          timestamp?: string
          site?: string
          status?: string
          notes?: string | null
          location?: string | null
          old_id?: string | null
        }
      }
      material_logs: {
        Row: {
          id: string
          material_id: string
          material_name: string
          material_type: string
          action: 'material-in' | 'material-out'
          quantity: number
          date: string
          time: string
          timestamp: string
          site: string
          status: string
          notes: string | null
          location: string | null
          old_id: string | null
        }
        Insert: {
          id?: string
          material_id: string
          material_name: string
          material_type: string
          action: 'material-in' | 'material-out'
          quantity: number
          date?: string
          time?: string
          timestamp?: string
          site: string
          status: string
          notes?: string | null
          location?: string | null
          old_id?: string | null
        }
        Update: {
          id?: string
          material_id?: string
          material_name?: string
          material_type?: string
          action?: 'material-in' | 'material-out'
          quantity?: number
          date?: string
          time?: string
          timestamp?: string
          site?: string
          status?: string
          notes?: string | null
          location?: string | null
          old_id?: string | null
        }
      }
      // Add other tables (employees, equipment, materials, sites, etc.) here
    }
  }
}