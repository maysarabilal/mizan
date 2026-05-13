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
      push_subscriptions: {
        Row: {
          id: string
          user_id: string
          office_id: string
          endpoint: string
          p256dh: string
          auth: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          office_id: string
          endpoint: string
          p256dh: string
          auth: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          office_id?: string
          endpoint?: string
          p256dh?: string
          auth?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_office_id_fkey"
            columns: ["office_id"]
            isOneToOne: false
            referencedRelation: "offices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "push_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      },
      profiles: {
        Row: {
          id: string
          full_name: string
          phone: string | null
          is_admin: boolean
          avatar_url: string | null
          job_title: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name: string
          phone?: string | null
          is_admin?: boolean
          avatar_url?: string | null
          job_title?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          phone?: string | null
          is_admin?: boolean
          avatar_url?: string | null
          job_title?: string | null
          created_at?: string
          updated_at?: string
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        Relationships: any[]
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        Relationships: any[]
      }
      offices: {
        Row: {
          id: string
          name: string
          settings: Json
          is_active: boolean
          logo_url: string | null
          specialization: string | null
          license_number: string | null
          address: string | null
          working_days: Json
          working_hours_start: string | null
          working_hours_end: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          settings?: Json
          is_active?: boolean
          logo_url?: string | null
          specialization?: string | null
          license_number?: string | null
          address?: string | null
          working_days?: Json
          working_hours_start?: string | null
          working_hours_end?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          settings?: Json
          is_active?: boolean
          logo_url?: string | null
          specialization?: string | null
          license_number?: string | null
          address?: string | null
          working_days?: Json
          working_hours_start?: string | null
          working_hours_end?: string | null
          created_at?: string
          updated_at?: string
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        Relationships: any[]
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        Relationships: any[]
      }
      case_fees: {
        Row: {
          id: string
          case_id: string
          office_id: string
          client_id: string | null
          total_amount: number
          notes: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          case_id: string
          office_id: string
          client_id?: string | null
          total_amount: number
          notes?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          case_id?: string
          office_id?: string
          client_id?: string | null
          total_amount?: number
          notes?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        Relationships: any[]
      }
      case_payments: {
        Row: {
          id: string
          case_fee_id: string
          office_id: string
          amount: number
          payment_date: string
          payment_method: string
          notes: string | null
          recorded_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          case_fee_id: string
          office_id: string
          amount: number
          payment_date: string
          payment_method: string
          notes?: string | null
          recorded_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          case_fee_id?: string
          office_id?: string
          amount?: number
          payment_date?: string
          payment_method?: string
          notes?: string | null
          recorded_by?: string | null
          created_at?: string
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        Relationships: any[]
      }
      case_expenses: {
        Row: {
          id: string
          case_id: string
          office_id: string
          amount: number
          expense_date: string
          description: string
          recorded_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          case_id: string
          office_id: string
          amount: number
          expense_date: string
          description: string
          recorded_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          case_id?: string
          office_id?: string
          amount?: number
          expense_date?: string
          description?: string
          recorded_by?: string | null
          created_at?: string
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        Relationships: any[]
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
          can_manage_fees: boolean
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
          can_manage_fees?: boolean
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
          can_manage_fees?: boolean
          created_at?: string
          updated_at?: string
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        Relationships: any[]
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        Relationships: any[]
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        Relationships: any[]
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        Relationships: any[]
      }
      clients: {
        Row: {
          id: string
          office_id: string
          name: string
          phone: string | null
          email: string | null
          id_number: string | null
          address: string | null
          avatar_url: string | null
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
          id_number?: string | null
          address?: string | null
          avatar_url?: string | null
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
          id_number?: string | null
          address?: string | null
          avatar_url?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        Relationships: any[]
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
          opposing_party: string | null
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
          opposing_party?: string | null
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
          opposing_party?: string | null
          created_at?: string
          updated_at?: string
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        Relationships: any[]
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        Relationships: any[]
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
          session_id: string | null
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
          session_id?: string | null
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
          session_id?: string | null
          created_by?: string
          created_at?: string
          updated_at?: string
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        Relationships: any[]
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        Relationships: any[]
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        Relationships: any[]
      }
      office_member_overage: {
        Row: {
          id: string
          office_id: string
          current_count: number
          max_users: number
          grace_deadline: string
          resolved: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          office_id: string
          current_count: number
          max_users: number
          grace_deadline: string
          resolved?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          office_id?: string
          current_count?: number
          max_users?: number
          grace_deadline?: string
          resolved?: boolean
          created_at?: string
          updated_at?: string
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        Relationships: any[]
      }
      case_attachments: {
        Row: {
          id: string
          case_id: string
          office_id: string
          uploaded_by: string
          file_name: string
          file_url: string
          file_type: string
          file_size: number
          created_at: string
        }
        Insert: {
          id?: string
          case_id: string
          office_id: string
          uploaded_by: string
          file_name: string
          file_url: string
          file_type: string
          file_size: number
          created_at?: string
        }
        Update: {
          id?: string
          case_id?: string
          office_id?: string
          uploaded_by?: string
          file_name?: string
          file_url?: string
          file_type?: string
          file_size?: number
          created_at?: string
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        Relationships: any[]
      }
      session_attachments: {
        Row: {
          id: string
          session_id: string
          office_id: string
          uploaded_by: string
          file_name: string
          file_url: string
          file_type: string
          file_size: number
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          office_id: string
          uploaded_by: string
          file_name: string
          file_url: string
          file_type: string
          file_size: number
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          office_id?: string
          uploaded_by?: string
          file_name?: string
          file_url?: string
          file_type?: string
          file_size?: number
          created_at?: string
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        Relationships: any[]
      }
      beta_feedback: {
        Row: {
          id: string
          ui_rating: number | null
          features_rating: number | null
          pricing_rating: number | null
          office_size: string | null
          current_tool: string | null
          most_needed_feature: string | null
          missing_feature: string | null
          general_notes: string | null
          contact_info: string | null
          user_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          ui_rating?: number | null
          features_rating?: number | null
          pricing_rating?: number | null
          office_size?: string | null
          current_tool?: string | null
          most_needed_feature?: string | null
          missing_feature?: string | null
          general_notes?: string | null
          contact_info?: string | null
          user_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          ui_rating?: number | null
          features_rating?: number | null
          pricing_rating?: number | null
          office_size?: string | null
          current_tool?: string | null
          most_needed_feature?: string | null
          missing_feature?: string | null
          general_notes?: string | null
          contact_info?: string | null
          user_id?: string | null
          created_at?: string
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        Relationships: any[]
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
      has_permission: {
        Args: {
          p_perm: string
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
      create_office_transaction: {
        Args: {
          p_user_id: string
          p_office_name: string
          p_plan_id: string
          p_trial_end: string
        }
        Returns: Json
      }
      nightly_maintenance: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      search_sessions: {
        Args: {
          search_term?: string | null
          filter_status?: string | null
          filter_type?: string | null
          filter_court?: string | null
          filter_date_from?: string | null
          filter_date_to?: string | null
          page_offset?: number
          page_limit?: number
        }
        Returns: any
      }
      global_search: {
        Args: {
          search_query: string
        }
        Returns: {
          type: string
          id: string
          title: string
          subtitle: string | null
        }[]
      }
      get_office_financial_summary: {
        Args: {
          p_office_id: string
        }
        Returns: Json
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
