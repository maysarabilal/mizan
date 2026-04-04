export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string
          phone: string | null
          is_admin: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name: string
          phone?: string | null
          is_admin?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          phone?: string | null
          is_admin?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: { foreignKeyName: string; columns: string[]; isOneToOne?: boolean | null; referencedRelation: string; referencedColumns: string[] }[]
      }
      subscription_plans: {
        Row: {
          id: string
          name: string
          price_ils: number
          max_users: number
          features: Json
          slug: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          price_ils: number
          max_users: number
          features?: Json
          slug: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          price_ils?: number
          max_users?: number
          features?: Json
          slug?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: { foreignKeyName: string; columns: string[]; isOneToOne?: boolean | null; referencedRelation: string; referencedColumns: string[] }[]
      }
      offices: {
        Row: {
          id: string
          name: string
          settings: Json
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          settings?: Json
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          settings?: Json
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: { foreignKeyName: string; columns: string[]; isOneToOne?: boolean | null; referencedRelation: string; referencedColumns: string[] }[]
      }
      office_subscriptions: {
        Row: {
          id: string
          office_id: string
          plan_id: string
          status: 'trialing' | 'active' | 'pending' | 'awaiting_payment' | 'expired' | 'cancelled' | 'past_due'
          current_period_end: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          office_id: string
          plan_id: string
          status: 'trialing' | 'active' | 'pending' | 'awaiting_payment' | 'expired' | 'cancelled' | 'past_due'
          current_period_end: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          office_id?: string
          plan_id?: string
          status?: 'trialing' | 'active' | 'pending' | 'awaiting_payment' | 'expired' | 'cancelled' | 'past_due'
          current_period_end?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: { foreignKeyName: string; columns: string[]; isOneToOne?: boolean | null; referencedRelation: string; referencedColumns: string[] }[]
      }
      office_members: {
        Row: {
          id: string
          office_id: string
          user_id: string
          role: 'owner' | 'admin' | 'lawyer' | 'secretary' | 'trainee'
          is_active: boolean
          permissions: Record<string, boolean>
          disabled_by_admin: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          office_id: string
          user_id: string
          role: 'owner' | 'admin' | 'lawyer' | 'secretary' | 'trainee'
          is_active?: boolean
          permissions?: Record<string, boolean>
          disabled_by_admin?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          office_id?: string
          user_id?: string
          role?: 'owner' | 'admin' | 'lawyer' | 'secretary' | 'trainee'
          is_active?: boolean
          permissions?: Record<string, boolean>
          disabled_by_admin?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: { foreignKeyName: string; columns: string[]; isOneToOne?: boolean | null; referencedRelation: string; referencedColumns: string[] }[]
      }
      invitations: {
        Row: {
          id: string
          office_id: string
          code: string
          role: 'admin' | 'lawyer' | 'secretary' | 'trainee'
          expires_at: string
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          office_id: string
          code: string
          role: string
          expires_at: string
          created_by: string
          created_at?: string
        }
        Update: {
          id?: string
          office_id?: string
          code?: string
          role?: string
          expires_at?: string
          created_by?: string
          created_at?: string
        }
        Relationships: { foreignKeyName: string; columns: string[]; isOneToOne?: boolean | null; referencedRelation: string; referencedColumns: string[] }[]
      }
      subscription_requests: {
        Row: {
          id: string
          office_id: string
          requested_plan_id: string
          status: 'pending' | 'awaiting_payment' | 'completed' | 'rejected'
          requested_by: string
          admin_note: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          office_id: string
          requested_plan_id: string
          status: 'pending' | 'awaiting_payment' | 'completed' | 'rejected'
          requested_by: string
          admin_note?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          office_id?: string
          requested_plan_id?: string
          status?: 'pending' | 'awaiting_payment' | 'completed' | 'rejected'
          requested_by?: string
          admin_note?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: { foreignKeyName: string; columns: string[]; isOneToOne?: boolean | null; referencedRelation: string; referencedColumns: string[] }[]
      }
      payments: {
        Row: {
          id: string
          office_id: string
          amount: number
          status: string
          payment_method: string
          confirmed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          office_id: string
          amount: number
          status: string
          payment_method?: string
          confirmed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          office_id?: string
          amount?: number
          status?: string
          payment_method?: string
          confirmed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: { foreignKeyName: string; columns: string[]; isOneToOne?: boolean | null; referencedRelation: string; referencedColumns: string[] }[]
      }
      clients: {
        Row: {
          id: string
          office_id: string
          name: string
          phone: string | null
          email: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          office_id: string
          name: string
          phone?: string | null
          email?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          office_id?: string
          name?: string
          phone?: string | null
          email?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: { foreignKeyName: string; columns: string[]; isOneToOne?: boolean | null; referencedRelation: string; referencedColumns: string[] }[]
      }
      cases: {
        Row: {
          id: string
          office_id: string
          client_id: string
          title: string
          case_number: string | null
          case_type: string
          status: string
          priority: string
          litigation_degree: string | null
          assigned_to: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          office_id: string
          client_id: string
          title: string
          case_number?: string | null
          case_type: string
          status?: string
          priority?: string
          litigation_degree?: string | null
          assigned_to?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          office_id?: string
          client_id?: string
          title?: string
          case_number?: string | null
          case_type?: string
          status?: string
          priority?: string
          litigation_degree?: string | null
          assigned_to?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: { foreignKeyName: string; columns: string[]; isOneToOne?: boolean | null; referencedRelation: string; referencedColumns: string[] }[]
      }
      sessions: {
        Row: {
          id: string
          office_id: string
          case_id: string
          session_date: string
          session_time: string | null
          court: string | null
          hall: string | null
          session_type: string | null
          outcome: string
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          office_id: string
          case_id: string
          session_date: string
          session_time?: string | null
          court?: string | null
          hall?: string | null
          session_type?: string | null
          outcome?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          office_id?: string
          case_id?: string
          session_date?: string
          session_time?: string | null
          court?: string | null
          hall?: string | null
          session_type?: string | null
          outcome?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: { foreignKeyName: string; columns: string[]; isOneToOne?: boolean | null; referencedRelation: string; referencedColumns: string[] }[]
      }
      tasks: {
        Row: {
          id: string
          office_id: string
          title: string
          description: string | null
          status: string
          priority: string
          due_date: string | null
          assigned_to: string | null
          case_id: string | null
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          office_id: string
          title: string
          description?: string | null
          status?: string
          priority?: string
          due_date?: string | null
          assigned_to?: string | null
          case_id?: string | null
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          office_id?: string
          title?: string
          description?: string | null
          status?: string
          priority?: string
          due_date?: string | null
          assigned_to?: string | null
          case_id?: string | null
          created_by?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: { foreignKeyName: string; columns: string[]; isOneToOne?: boolean | null; referencedRelation: string; referencedColumns: string[] }[]
      }
      notifications: {
        Row: {
          id: string
          office_id: string
          user_id: string
          type: string
          title: string
          body: string
          is_read: boolean
          related_entity_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          office_id: string
          user_id: string
          type: string
          title: string
          body: string
          is_read?: boolean
          related_entity_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          office_id?: string
          user_id?: string
          type?: string
          title?: string
          body?: string
          is_read?: boolean
          related_entity_id?: string | null
          created_at?: string
        }
        Relationships: { foreignKeyName: string; columns: string[]; isOneToOne?: boolean | null; referencedRelation: string; referencedColumns: string[] }[]
      }
      audit_logs: {
        Row: {
          id: string
          office_id: string | null
          user_id: string | null
          action: string
          entity_type: string
          entity_id: string
          details: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          office_id?: string | null
          user_id?: string | null
          action: string
          entity_type: string
          entity_id: string
          details?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          office_id?: string | null
          user_id?: string | null
          action?: string
          entity_type?: string
          entity_id?: string
          details?: Json | null
          created_at?: string
        }
        Relationships: { foreignKeyName: string; columns: string[]; isOneToOne?: boolean | null; referencedRelation: string; referencedColumns: string[] }[]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_office_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      has_role: {
        Args: {
          required_roles: string[]
        }
        Returns: boolean
      }
      is_platform_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      redeem_invitation: {
        Args: {
          p_user_id: string
          p_invite_code: string
        }
        Returns: {
          office_id: string
          role: string
          error: string | null
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
