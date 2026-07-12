export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
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
  public: {
    Tables: {
      accounts: {
        Row: {
          account_number_mask: string | null
          balance: number
          bank_name: string | null
          belvo_account_id: string | null
          belvo_link_id: string | null
          color: string | null
          created_at: string
          credit_limit: number | null
          currency: string
          icon: string | null
          id: string
          initial_balance: number
          interest_rate: number | null
          is_archived: boolean
          is_included_in_net_worth: boolean
          last_sync_at: string | null
          name: string
          parent_account_id: string | null
          status: Database["public"]["Enums"]["account_status"]
          type: Database["public"]["Enums"]["account_type"]
          updated_at: string
          user_id: string
          version: number
          virtual_buckets: Json
        }
        Insert: {
          account_number_mask?: string | null
          balance?: number
          bank_name?: string | null
          belvo_account_id?: string | null
          belvo_link_id?: string | null
          color?: string | null
          created_at?: string
          credit_limit?: number | null
          currency?: string
          icon?: string | null
          id?: string
          initial_balance?: number
          interest_rate?: number | null
          is_archived?: boolean
          is_included_in_net_worth?: boolean
          last_sync_at?: string | null
          name: string
          parent_account_id?: string | null
          status?: Database["public"]["Enums"]["account_status"]
          type: Database["public"]["Enums"]["account_type"]
          updated_at?: string
          user_id: string
          version?: number
          virtual_buckets?: Json
        }
        Update: {
          account_number_mask?: string | null
          balance?: number
          bank_name?: string | null
          belvo_account_id?: string | null
          belvo_link_id?: string | null
          color?: string | null
          created_at?: string
          credit_limit?: number | null
          currency?: string
          icon?: string | null
          id?: string
          initial_balance?: number
          interest_rate?: number | null
          is_archived?: boolean
          is_included_in_net_worth?: boolean
          last_sync_at?: string | null
          name?: string
          parent_account_id?: string | null
          status?: Database["public"]["Enums"]["account_status"]
          type?: Database["public"]["Enums"]["account_type"]
          updated_at?: string
          user_id?: string
          version?: number
          virtual_buckets?: Json
        }
        Relationships: [
          {
            foreignKeyName: "accounts_currency_fkey"
            columns: ["currency"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "accounts_parent_account_id_fkey"
            columns: ["parent_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      achievements: {
        Row: {
          category: Database["public"]["Enums"]["achievement_category"]
          code: string
          created_at: string
          description: string
          icon: string | null
          id: string
          is_active: boolean
          name: string
          points: number
          tier: number | null
          trigger_rule: Json
        }
        Insert: {
          category: Database["public"]["Enums"]["achievement_category"]
          code: string
          created_at?: string
          description: string
          icon?: string | null
          id?: string
          is_active?: boolean
          name: string
          points?: number
          tier?: number | null
          trigger_rule: Json
        }
        Update: {
          category?: Database["public"]["Enums"]["achievement_category"]
          code?: string
          created_at?: string
          description?: string
          icon?: string | null
          id?: string
          is_active?: boolean
          name?: string
          points?: number
          tier?: number | null
          trigger_rule?: Json
        }
        Relationships: []
      }
      alert_rules: {
        Row: {
          channels: Json
          config: Json
          created_at: string
          id: string
          is_active: boolean
          kind: Database["public"]["Enums"]["alert_kind"]
          updated_at: string
          user_id: string
        }
        Insert: {
          channels?: Json
          config: Json
          created_at?: string
          id?: string
          is_active?: boolean
          kind: Database["public"]["Enums"]["alert_kind"]
          updated_at?: string
          user_id: string
        }
        Update: {
          channels?: Json
          config?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          kind?: Database["public"]["Enums"]["alert_kind"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "alert_rules_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      attachments: {
        Row: {
          caption: string | null
          created_at: string
          entity_id: string
          entity_type: string
          file_size_bytes: number | null
          file_type: string
          id: string
          mime_type: string | null
          original_filename: string | null
          storage_path: string
          user_id: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          entity_id: string
          entity_type: string
          file_size_bytes?: number | null
          file_type: string
          id?: string
          mime_type?: string | null
          original_filename?: string | null
          storage_path: string
          user_id: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          entity_id?: string
          entity_type?: string
          file_size_bytes?: number | null
          file_type?: string
          id?: string
          mime_type?: string | null
          original_filename?: string | null
          storage_path?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attachments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          acting_user_id: string | null
          action: Database["public"]["Enums"]["audit_action"]
          after_data: Json | null
          before_data: Json | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: unknown
          metadata: Json | null
          session_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          acting_user_id?: string | null
          action: Database["public"]["Enums"]["audit_action"]
          after_data?: Json | null
          before_data?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          acting_user_id?: string | null
          action?: Database["public"]["Enums"]["audit_action"]
          after_data?: Json | null
          before_data?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_acting_user_id_fkey"
            columns: ["acting_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_customers: {
        Row: {
          created_at: string
          default_payment_method: string | null
          stripe_customer_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          default_payment_method?: string | null
          stripe_customer_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          default_payment_method?: string | null
          stripe_customer_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_customers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_events: {
        Row: {
          created_at: string
          error: string | null
          event_type: string
          id: string
          payload: Json
          processed: boolean
          processed_at: string | null
          stripe_event_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          error?: string | null
          event_type: string
          id?: string
          payload: Json
          processed?: boolean
          processed_at?: string | null
          stripe_event_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          error?: string | null
          event_type?: string
          id?: string
          payload?: Json
          processed?: boolean
          processed_at?: string | null
          stripe_event_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "billing_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_subscriptions: {
        Row: {
          amount: number | null
          cancel_at: string | null
          canceled_at: string | null
          created_at: string
          currency: string | null
          current_period_end: string | null
          current_period_start: string | null
          id: string
          interval: string | null
          metadata: Json | null
          plan: Database["public"]["Enums"]["plan_tier"]
          status: Database["public"]["Enums"]["billing_status"]
          stripe_price_id: string
          stripe_subscription_id: string
          trial_end: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number | null
          cancel_at?: string | null
          canceled_at?: string | null
          created_at?: string
          currency?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          interval?: string | null
          metadata?: Json | null
          plan: Database["public"]["Enums"]["plan_tier"]
          status: Database["public"]["Enums"]["billing_status"]
          stripe_price_id: string
          stripe_subscription_id: string
          trial_end?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number | null
          cancel_at?: string | null
          canceled_at?: string | null
          created_at?: string
          currency?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          interval?: string | null
          metadata?: Json | null
          plan?: Database["public"]["Enums"]["plan_tier"]
          status?: Database["public"]["Enums"]["billing_status"]
          stripe_price_id?: string
          stripe_subscription_id?: string
          trial_end?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_subscriptions_currency_fkey"
            columns: ["currency"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "billing_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_categories: {
        Row: {
          allocated_amount: number
          available_amount: number | null
          budget_id: string
          category_id: string
          created_at: string
          id: string
          notes: string | null
          rollover_amount: number
          spent_amount: number
          status: Database["public"]["Enums"]["budget_status"] | null
          updated_at: string
          warning_threshold: number | null
        }
        Insert: {
          allocated_amount?: number
          available_amount?: number | null
          budget_id: string
          category_id: string
          created_at?: string
          id?: string
          notes?: string | null
          rollover_amount?: number
          spent_amount?: number
          status?: Database["public"]["Enums"]["budget_status"] | null
          updated_at?: string
          warning_threshold?: number | null
        }
        Update: {
          allocated_amount?: number
          available_amount?: number | null
          budget_id?: string
          category_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          rollover_amount?: number
          spent_amount?: number
          status?: Database["public"]["Enums"]["budget_status"] | null
          updated_at?: string
          warning_threshold?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "budget_categories_budget_id_fkey"
            columns: ["budget_id"]
            isOneToOne: false
            referencedRelation: "budgets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "v_user_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      budgets: {
        Row: {
          collab_space_id: string | null
          created_at: string
          currency: string
          id: string
          is_locked: boolean
          is_template: boolean
          mode: Database["public"]["Enums"]["budget_mode"]
          notes: string | null
          period_end: string
          period_start: string
          rollover_overspent: boolean
          rollover_unspent: boolean
          total_allocated: number
          total_income_expected: number
          total_spent: number
          unallocated: number | null
          updated_at: string
          user_id: string
          version: number
        }
        Insert: {
          collab_space_id?: string | null
          created_at?: string
          currency?: string
          id?: string
          is_locked?: boolean
          is_template?: boolean
          mode: Database["public"]["Enums"]["budget_mode"]
          notes?: string | null
          period_end: string
          period_start: string
          rollover_overspent?: boolean
          rollover_unspent?: boolean
          total_allocated?: number
          total_income_expected?: number
          total_spent?: number
          unallocated?: number | null
          updated_at?: string
          user_id: string
          version?: number
        }
        Update: {
          collab_space_id?: string | null
          created_at?: string
          currency?: string
          id?: string
          is_locked?: boolean
          is_template?: boolean
          mode?: Database["public"]["Enums"]["budget_mode"]
          notes?: string | null
          period_end?: string
          period_start?: string
          rollover_overspent?: boolean
          rollover_unspent?: boolean
          total_allocated?: number
          total_income_expected?: number
          total_spent?: number
          unallocated?: number | null
          updated_at?: string
          user_id?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "budgets_collab_space_id_fkey"
            columns: ["collab_space_id"]
            isOneToOne: false
            referencedRelation: "collab_spaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budgets_currency_fkey"
            columns: ["currency"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "budgets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          archived_at: string | null
          color: string | null
          created_at: string
          icon: string | null
          id: string
          is_system: boolean
          is_tax_deductible: boolean
          money_class: Database["public"]["Enums"]["money_class"]
          name: string
          parent_id: string | null
          sort_order: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          archived_at?: string | null
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          is_system?: boolean
          is_tax_deductible?: boolean
          money_class?: Database["public"]["Enums"]["money_class"]
          name: string
          parent_id?: string | null
          sort_order?: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          archived_at?: string | null
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          is_system?: boolean
          is_tax_deductible?: boolean
          money_class?: Database["public"]["Enums"]["money_class"]
          name?: string
          parent_id?: string | null
          sort_order?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "v_user_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "categories_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      cc_statements: {
        Row: {
          amount_paid: number | null
          card_id: string
          charges: number
          created_at: string
          cut_date: string
          due_date: string
          fees_charged: number
          id: string
          interest_charged: number
          is_paid: boolean
          minimum_payment: number
          new_balance: number
          ocr_data: Json | null
          paid_at: string | null
          payment_no_interest: number
          payments: number
          previous_balance: number
          statement_pdf_url: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_paid?: number | null
          card_id: string
          charges?: number
          created_at?: string
          cut_date: string
          due_date: string
          fees_charged?: number
          id?: string
          interest_charged?: number
          is_paid?: boolean
          minimum_payment?: number
          new_balance?: number
          ocr_data?: Json | null
          paid_at?: string | null
          payment_no_interest?: number
          payments?: number
          previous_balance?: number
          statement_pdf_url?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_paid?: number | null
          card_id?: string
          charges?: number
          created_at?: string
          cut_date?: string
          due_date?: string
          fees_charged?: number
          id?: string
          interest_charged?: number
          is_paid?: boolean
          minimum_payment?: number
          new_balance?: number
          ocr_data?: Json | null
          paid_at?: string | null
          payment_no_interest?: number
          payments?: number
          previous_balance?: number
          statement_pdf_url?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cc_statements_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "credit_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cc_statements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      collab_members: {
        Row: {
          created_at: string
          id: string
          invited_at: string
          invited_email: string | null
          joined_at: string | null
          role: Database["public"]["Enums"]["collab_role"]
          space_id: string
          split_percentage: number | null
          status: Database["public"]["Enums"]["collab_status"]
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          invited_at?: string
          invited_email?: string | null
          joined_at?: string | null
          role?: Database["public"]["Enums"]["collab_role"]
          space_id: string
          split_percentage?: number | null
          status?: Database["public"]["Enums"]["collab_status"]
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          invited_at?: string
          invited_email?: string | null
          joined_at?: string | null
          role?: Database["public"]["Enums"]["collab_role"]
          space_id?: string
          split_percentage?: number | null
          status?: Database["public"]["Enums"]["collab_status"]
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "collab_members_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "collab_spaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collab_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      collab_spaces: {
        Row: {
          created_at: string
          default_currency: string
          default_split_rule: Json | null
          description: string | null
          id: string
          kind: Database["public"]["Enums"]["collab_kind"]
          name: string
          owner_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          default_currency?: string
          default_split_rule?: Json | null
          description?: string | null
          id?: string
          kind: Database["public"]["Enums"]["collab_kind"]
          name: string
          owner_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          default_currency?: string
          default_split_rule?: Json | null
          description?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["collab_kind"]
          name?: string
          owner_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "collab_spaces_default_currency_fkey"
            columns: ["default_currency"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "collab_spaces_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_cards: {
        Row: {
          account_id: string | null
          annual_fee: number | null
          annual_fee_month: number | null
          available_credit: number | null
          bank_name: string
          card_brand: string | null
          card_holder: string | null
          card_name: string
          card_number_mask: string | null
          color: string | null
          created_at: string
          credit_limit: number
          currency: string
          current_balance: number
          cut_day: number
          icon: string | null
          id: string
          interest_rate_annual: number
          interest_rate_monthly: number | null
          min_payment_pct: number | null
          payment_due_day: number
          rewards_balance: number | null
          rewards_program: string | null
          status: Database["public"]["Enums"]["account_status"]
          updated_at: string
          user_id: string
          utilization_pct: number | null
        }
        Insert: {
          account_id?: string | null
          annual_fee?: number | null
          annual_fee_month?: number | null
          available_credit?: number | null
          bank_name: string
          card_brand?: string | null
          card_holder?: string | null
          card_name: string
          card_number_mask?: string | null
          color?: string | null
          created_at?: string
          credit_limit: number
          currency?: string
          current_balance?: number
          cut_day: number
          icon?: string | null
          id?: string
          interest_rate_annual?: number
          interest_rate_monthly?: number | null
          min_payment_pct?: number | null
          payment_due_day: number
          rewards_balance?: number | null
          rewards_program?: string | null
          status?: Database["public"]["Enums"]["account_status"]
          updated_at?: string
          user_id: string
          utilization_pct?: number | null
        }
        Update: {
          account_id?: string | null
          annual_fee?: number | null
          annual_fee_month?: number | null
          available_credit?: number | null
          bank_name?: string
          card_brand?: string | null
          card_holder?: string | null
          card_name?: string
          card_number_mask?: string | null
          color?: string | null
          created_at?: string
          credit_limit?: number
          currency?: string
          current_balance?: number
          cut_day?: number
          icon?: string | null
          id?: string
          interest_rate_annual?: number
          interest_rate_monthly?: number | null
          min_payment_pct?: number | null
          payment_due_day?: number
          rewards_balance?: number | null
          rewards_program?: string | null
          status?: Database["public"]["Enums"]["account_status"]
          updated_at?: string
          user_id?: string
          utilization_pct?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "credit_cards_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_cards_currency_fkey"
            columns: ["currency"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "credit_cards_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      currencies: {
        Row: {
          code: string
          decimals: number
          is_active: boolean
          name: string
          symbol: string
        }
        Insert: {
          code: string
          decimals?: number
          is_active?: boolean
          name: string
          symbol: string
        }
        Update: {
          code?: string
          decimals?: number
          is_active?: boolean
          name?: string
          symbol?: string
        }
        Relationships: []
      }
      debt_payments: {
        Row: {
          amount: number
          amount_base: number | null
          balance_after: number
          created_at: string
          currency: string
          debt_id: string
          fees_portion: number | null
          fx_rate: number | null
          id: string
          interest_portion: number
          is_extra: boolean
          notes: string | null
          payment_date: string
          principal_portion: number
          transaction_id: string | null
          user_id: string
        }
        Insert: {
          amount: number
          amount_base?: number | null
          balance_after: number
          created_at?: string
          currency?: string
          debt_id: string
          fees_portion?: number | null
          fx_rate?: number | null
          id?: string
          interest_portion: number
          is_extra?: boolean
          notes?: string | null
          payment_date: string
          principal_portion: number
          transaction_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          amount_base?: number | null
          balance_after?: number
          created_at?: string
          currency?: string
          debt_id?: string
          fees_portion?: number | null
          fx_rate?: number | null
          id?: string
          interest_portion?: number
          is_extra?: boolean
          notes?: string | null
          payment_date?: string
          principal_portion?: number
          transaction_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "debt_payments_currency_fkey"
            columns: ["currency"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "debt_payments_debt_id_fkey"
            columns: ["debt_id"]
            isOneToOne: false
            referencedRelation: "debts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "debt_payments_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "debt_payments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      debts: {
        Row: {
          contract_url: string | null
          created_at: string
          creditor: string
          currency: string
          current_balance: number
          deleted_at: string | null
          end_date: string | null
          id: string
          interest_rate_annual: number
          monthly_payment: number | null
          name: string
          next_payment_amount: number | null
          next_payment_date: string | null
          notes: string | null
          original_amount: number
          payoff_priority: number | null
          start_date: string
          status: Database["public"]["Enums"]["loan_status"]
          strategy: Database["public"]["Enums"]["debt_strategy"] | null
          term_months: number | null
          type: Database["public"]["Enums"]["liability_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          contract_url?: string | null
          created_at?: string
          creditor: string
          currency?: string
          current_balance: number
          deleted_at?: string | null
          end_date?: string | null
          id?: string
          interest_rate_annual: number
          monthly_payment?: number | null
          name: string
          next_payment_amount?: number | null
          next_payment_date?: string | null
          notes?: string | null
          original_amount: number
          payoff_priority?: number | null
          start_date: string
          status?: Database["public"]["Enums"]["loan_status"]
          strategy?: Database["public"]["Enums"]["debt_strategy"] | null
          term_months?: number | null
          type: Database["public"]["Enums"]["liability_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          contract_url?: string | null
          created_at?: string
          creditor?: string
          currency?: string
          current_balance?: number
          deleted_at?: string | null
          end_date?: string | null
          id?: string
          interest_rate_annual?: number
          monthly_payment?: number | null
          name?: string
          next_payment_amount?: number | null
          next_payment_date?: string | null
          notes?: string | null
          original_amount?: number
          payoff_priority?: number | null
          start_date?: string
          status?: Database["public"]["Enums"]["loan_status"]
          strategy?: Database["public"]["Enums"]["debt_strategy"] | null
          term_months?: number | null
          type?: Database["public"]["Enums"]["liability_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "debts_currency_fkey"
            columns: ["currency"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "debts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      devices: {
        Row: {
          app_version: string | null
          biometric_enabled: boolean
          created_at: string
          device_token: string
          id: string
          last_seen_at: string
          name: string | null
          os_version: string | null
          platform: string
          push_enabled: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          app_version?: string | null
          biometric_enabled?: boolean
          created_at?: string
          device_token: string
          id?: string
          last_seen_at?: string
          name?: string | null
          os_version?: string | null
          platform: string
          push_enabled?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          app_version?: string | null
          biometric_enabled?: boolean
          created_at?: string
          device_token?: string
          id?: string
          last_seen_at?: string
          name?: string | null
          os_version?: string | null
          platform?: string
          push_enabled?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "devices_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      family_loan_payments: {
        Row: {
          amount: number
          created_at: string
          destination_account_id: string | null
          evidence_url: string | null
          id: string
          loan_id: string
          notes: string | null
          paid_at: string
          payment_method: string | null
          resulting_balance: number
          transaction_id: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          destination_account_id?: string | null
          evidence_url?: string | null
          id?: string
          loan_id: string
          notes?: string | null
          paid_at: string
          payment_method?: string | null
          resulting_balance: number
          transaction_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          destination_account_id?: string | null
          evidence_url?: string | null
          id?: string
          loan_id?: string
          notes?: string | null
          paid_at?: string
          payment_method?: string | null
          resulting_balance?: number
          transaction_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "family_loan_payments_destination_account_id_fkey"
            columns: ["destination_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "family_loan_payments_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "family_loans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "family_loan_payments_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "family_loan_payments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      family_loans: {
        Row: {
          agreed_payment_date: string | null
          balance: number
          category: string | null
          created_at: string
          currency: string
          delivery_date: string
          delivery_method: string
          evidence_url: string | null
          id: string
          linked_amount: number | null
          notes: string | null
          origin_account_id: string | null
          origin_card_id: string | null
          original_amount: number
          person_name: string
          relationship: string | null
          status: string
          transaction_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          agreed_payment_date?: string | null
          balance: number
          category?: string | null
          created_at?: string
          currency?: string
          delivery_date: string
          delivery_method: string
          evidence_url?: string | null
          id?: string
          linked_amount?: number | null
          notes?: string | null
          origin_account_id?: string | null
          origin_card_id?: string | null
          original_amount: number
          person_name: string
          relationship?: string | null
          status?: string
          transaction_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          agreed_payment_date?: string | null
          balance?: number
          category?: string | null
          created_at?: string
          currency?: string
          delivery_date?: string
          delivery_method?: string
          evidence_url?: string | null
          id?: string
          linked_amount?: number | null
          notes?: string | null
          origin_account_id?: string | null
          origin_card_id?: string | null
          original_amount?: number
          person_name?: string
          relationship?: string | null
          status?: string
          transaction_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "family_loans_currency_fkey"
            columns: ["currency"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "family_loans_origin_account_id_fkey"
            columns: ["origin_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "family_loans_origin_card_id_fkey"
            columns: ["origin_card_id"]
            isOneToOne: false
            referencedRelation: "credit_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "family_loans_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "family_loans_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      finn_conversations: {
        Row: {
          context_snapshot: Json | null
          created_at: string
          ended_at: string | null
          id: string
          model_used: string | null
          session_kind: Database["public"]["Enums"]["finn_session_kind"]
          title: string | null
          total_cost_usd: number | null
          total_tokens_in: number | null
          total_tokens_out: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          context_snapshot?: Json | null
          created_at?: string
          ended_at?: string | null
          id?: string
          model_used?: string | null
          session_kind: Database["public"]["Enums"]["finn_session_kind"]
          title?: string | null
          total_cost_usd?: number | null
          total_tokens_in?: number | null
          total_tokens_out?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          context_snapshot?: Json | null
          created_at?: string
          ended_at?: string | null
          id?: string
          model_used?: string | null
          session_kind?: Database["public"]["Enums"]["finn_session_kind"]
          title?: string | null
          total_cost_usd?: number | null
          total_tokens_in?: number | null
          total_tokens_out?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "finn_conversations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      finn_insights: {
        Row: {
          acted_at: string | null
          action_label: string | null
          action_payload: Json | null
          body: string
          created_at: string
          dismissed_at: string | null
          expires_at: string | null
          id: string
          kind: string
          model_used: string | null
          priority: number | null
          related_entity_id: string | null
          related_entity_type: string | null
          shown_at: string | null
          title: string
          user_id: string
        }
        Insert: {
          acted_at?: string | null
          action_label?: string | null
          action_payload?: Json | null
          body: string
          created_at?: string
          dismissed_at?: string | null
          expires_at?: string | null
          id?: string
          kind: string
          model_used?: string | null
          priority?: number | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          shown_at?: string | null
          title: string
          user_id: string
        }
        Update: {
          acted_at?: string | null
          action_label?: string | null
          action_payload?: Json | null
          body?: string
          created_at?: string
          dismissed_at?: string | null
          expires_at?: string | null
          id?: string
          kind?: string
          model_used?: string | null
          priority?: number | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          shown_at?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "finn_insights_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      finn_messages: {
        Row: {
          content: string | null
          conversation_id: string
          created_at: string
          id: string
          latency_ms: number | null
          model: string | null
          parts: Json | null
          role: string
          tokens_in: number | null
          tokens_out: number | null
          tool_input: Json | null
          tool_name: string | null
          tool_output: Json | null
          user_id: string
        }
        Insert: {
          content?: string | null
          conversation_id: string
          created_at?: string
          id?: string
          latency_ms?: number | null
          model?: string | null
          parts?: Json | null
          role: string
          tokens_in?: number | null
          tokens_out?: number | null
          tool_input?: Json | null
          tool_name?: string | null
          tool_output?: Json | null
          user_id: string
        }
        Update: {
          content?: string | null
          conversation_id?: string
          created_at?: string
          id?: string
          latency_ms?: number | null
          model?: string | null
          parts?: Json | null
          role?: string
          tokens_in?: number | null
          tokens_out?: number | null
          tool_input?: Json | null
          tool_name?: string | null
          tool_output?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "finn_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "finn_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finn_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      flow_scores: {
        Row: {
          budget_adherence_score: number
          computed_at: string
          consistency_score: number
          debt_ratio_score: number
          debt_to_income_ratio: number | null
          delta_vs_prev_week: number | null
          diversification_score: number
          emergency_fund_months: number | null
          emergency_fund_score: number
          goal_progress_score: number
          growth_score: number
          id: string
          level: string
          net_worth: number | null
          savings_rate: number | null
          savings_rate_score: number
          score_week: string
          total_score: number
          user_id: string
        }
        Insert: {
          budget_adherence_score?: number
          computed_at?: string
          consistency_score?: number
          debt_ratio_score?: number
          debt_to_income_ratio?: number | null
          delta_vs_prev_week?: number | null
          diversification_score?: number
          emergency_fund_months?: number | null
          emergency_fund_score?: number
          goal_progress_score?: number
          growth_score?: number
          id?: string
          level: string
          net_worth?: number | null
          savings_rate?: number | null
          savings_rate_score?: number
          score_week: string
          total_score: number
          user_id: string
        }
        Update: {
          budget_adherence_score?: number
          computed_at?: string
          consistency_score?: number
          debt_ratio_score?: number
          debt_to_income_ratio?: number | null
          delta_vs_prev_week?: number | null
          diversification_score?: number
          emergency_fund_months?: number | null
          emergency_fund_score?: number
          goal_progress_score?: number
          growth_score?: number
          id?: string
          level?: string
          net_worth?: number | null
          savings_rate?: number | null
          savings_rate_score?: number
          score_week?: string
          total_score?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "flow_scores_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      fx_rates: {
        Row: {
          created_at: string
          from_currency: string
          id: string
          rate: number
          rate_date: string
          source: string
          to_currency: string
        }
        Insert: {
          created_at?: string
          from_currency: string
          id?: string
          rate: number
          rate_date: string
          source?: string
          to_currency: string
        }
        Update: {
          created_at?: string
          from_currency?: string
          id?: string
          rate?: number
          rate_date?: string
          source?: string
          to_currency?: string
        }
        Relationships: [
          {
            foreignKeyName: "fx_rates_from_currency_fkey"
            columns: ["from_currency"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "fx_rates_to_currency_fkey"
            columns: ["to_currency"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["code"]
          },
        ]
      }
      goal_contributions: {
        Row: {
          amount: number
          amount_base: number | null
          contribution_date: string
          created_at: string
          currency: string
          fx_rate: number | null
          goal_id: string
          id: string
          income_entry_id: string | null
          notes: string | null
          source: string | null
          transaction_id: string | null
          user_id: string
        }
        Insert: {
          amount: number
          amount_base?: number | null
          contribution_date: string
          created_at?: string
          currency?: string
          fx_rate?: number | null
          goal_id: string
          id?: string
          income_entry_id?: string | null
          notes?: string | null
          source?: string | null
          transaction_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          amount_base?: number | null
          contribution_date?: string
          created_at?: string
          currency?: string
          fx_rate?: number | null
          goal_id?: string
          id?: string
          income_entry_id?: string | null
          notes?: string | null
          source?: string | null
          transaction_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "goal_contributions_currency_fkey"
            columns: ["currency"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "goal_contributions_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goal_contributions_income_entry_id_fkey"
            columns: ["income_entry_id"]
            isOneToOne: false
            referencedRelation: "income_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goal_contributions_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goal_contributions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          account_id: string | null
          ai_feasibility_score: number | null
          ai_recommendation: string | null
          ai_updated_at: string | null
          auto_contribution_pct: number | null
          collab_space_id: string | null
          color: string | null
          completed_at: string | null
          created_at: string
          currency: string
          current_amount: number
          deleted_at: string | null
          description: string | null
          icon: string | null
          id: string
          monthly_contribution: number | null
          name: string
          priority: number | null
          progress_pct: number | null
          start_date: string
          status: Database["public"]["Enums"]["goal_status"]
          target_amount: number
          target_date: string | null
          type: Database["public"]["Enums"]["goal_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          account_id?: string | null
          ai_feasibility_score?: number | null
          ai_recommendation?: string | null
          ai_updated_at?: string | null
          auto_contribution_pct?: number | null
          collab_space_id?: string | null
          color?: string | null
          completed_at?: string | null
          created_at?: string
          currency?: string
          current_amount?: number
          deleted_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          monthly_contribution?: number | null
          name: string
          priority?: number | null
          progress_pct?: number | null
          start_date?: string
          status?: Database["public"]["Enums"]["goal_status"]
          target_amount: number
          target_date?: string | null
          type: Database["public"]["Enums"]["goal_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          account_id?: string | null
          ai_feasibility_score?: number | null
          ai_recommendation?: string | null
          ai_updated_at?: string | null
          auto_contribution_pct?: number | null
          collab_space_id?: string | null
          color?: string | null
          completed_at?: string | null
          created_at?: string
          currency?: string
          current_amount?: number
          deleted_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          monthly_contribution?: number | null
          name?: string
          priority?: number | null
          progress_pct?: number | null
          start_date?: string
          status?: Database["public"]["Enums"]["goal_status"]
          target_amount?: number
          target_date?: string | null
          type?: Database["public"]["Enums"]["goal_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "goals_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goals_collab_space_id_fkey"
            columns: ["collab_space_id"]
            isOneToOne: false
            referencedRelation: "collab_spaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goals_currency_fkey"
            columns: ["currency"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "goals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      income_entries: {
        Row: {
          account_id: string | null
          amount_base: number | null
          created_at: string
          currency: string
          deductions: Json
          deleted_at: string | null
          expected_date: string | null
          fx_rate: number | null
          goal_allocation: Json | null
          gross_amount: number
          id: string
          income_date: string
          invoice_number: string | null
          invoice_url: string | null
          is_collected: boolean
          is_recurring: boolean
          is_tax_relevant: boolean
          net_amount: number
          notes: string | null
          pay_period_end: string | null
          pay_period_start: string | null
          recurring_id: string | null
          source_name: string
          tags: string[] | null
          tax_withheld: number | null
          transaction_id: string | null
          type: Database["public"]["Enums"]["income_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          account_id?: string | null
          amount_base?: number | null
          created_at?: string
          currency?: string
          deductions?: Json
          deleted_at?: string | null
          expected_date?: string | null
          fx_rate?: number | null
          goal_allocation?: Json | null
          gross_amount: number
          id?: string
          income_date: string
          invoice_number?: string | null
          invoice_url?: string | null
          is_collected?: boolean
          is_recurring?: boolean
          is_tax_relevant?: boolean
          net_amount: number
          notes?: string | null
          pay_period_end?: string | null
          pay_period_start?: string | null
          recurring_id?: string | null
          source_name: string
          tags?: string[] | null
          tax_withheld?: number | null
          transaction_id?: string | null
          type: Database["public"]["Enums"]["income_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          account_id?: string | null
          amount_base?: number | null
          created_at?: string
          currency?: string
          deductions?: Json
          deleted_at?: string | null
          expected_date?: string | null
          fx_rate?: number | null
          goal_allocation?: Json | null
          gross_amount?: number
          id?: string
          income_date?: string
          invoice_number?: string | null
          invoice_url?: string | null
          is_collected?: boolean
          is_recurring?: boolean
          is_tax_relevant?: boolean
          net_amount?: number
          notes?: string | null
          pay_period_end?: string | null
          pay_period_start?: string | null
          recurring_id?: string | null
          source_name?: string
          tags?: string[] | null
          tax_withheld?: number | null
          transaction_id?: string | null
          type?: Database["public"]["Enums"]["income_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "income_entries_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "income_entries_currency_fkey"
            columns: ["currency"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "income_entries_recurring_id_fkey"
            columns: ["recurring_id"]
            isOneToOne: false
            referencedRelation: "recurrings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "income_entries_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "income_entries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      investment_transactions: {
        Row: {
          action: string
          amount_base: number | null
          created_at: string
          currency: string
          fees: number | null
          fx_rate: number | null
          id: string
          investment_id: string
          notes: string | null
          price: number
          quantity: number
          settlement_date: string | null
          total: number
          trade_date: string
          transaction_id: string | null
          user_id: string
        }
        Insert: {
          action: string
          amount_base?: number | null
          created_at?: string
          currency?: string
          fees?: number | null
          fx_rate?: number | null
          id?: string
          investment_id: string
          notes?: string | null
          price: number
          quantity: number
          settlement_date?: string | null
          total: number
          trade_date: string
          transaction_id?: string | null
          user_id: string
        }
        Update: {
          action?: string
          amount_base?: number | null
          created_at?: string
          currency?: string
          fees?: number | null
          fx_rate?: number | null
          id?: string
          investment_id?: string
          notes?: string | null
          price?: number
          quantity?: number
          settlement_date?: string | null
          total?: number
          trade_date?: string
          transaction_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "investment_transactions_currency_fkey"
            columns: ["currency"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "investment_transactions_investment_id_fkey"
            columns: ["investment_id"]
            isOneToOne: false
            referencedRelation: "investments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "investment_transactions_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "investment_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      investments: {
        Row: {
          account_id: string | null
          avg_cost: number
          broker: string | null
          created_at: string
          currency: string
          current_price: number | null
          current_value: number | null
          id: string
          is_active: boolean
          last_price_update_at: string | null
          metadata: Json | null
          name: string
          notes: string | null
          quantity: number
          ticker: string | null
          total_invested: number | null
          type: Database["public"]["Enums"]["investment_type"]
          unrealized_pnl: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          account_id?: string | null
          avg_cost?: number
          broker?: string | null
          created_at?: string
          currency?: string
          current_price?: number | null
          current_value?: number | null
          id?: string
          is_active?: boolean
          last_price_update_at?: string | null
          metadata?: Json | null
          name: string
          notes?: string | null
          quantity?: number
          ticker?: string | null
          total_invested?: number | null
          type: Database["public"]["Enums"]["investment_type"]
          unrealized_pnl?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          account_id?: string | null
          avg_cost?: number
          broker?: string | null
          created_at?: string
          currency?: string
          current_price?: number | null
          current_value?: number | null
          id?: string
          is_active?: boolean
          last_price_update_at?: string | null
          metadata?: Json | null
          name?: string
          notes?: string | null
          quantity?: number
          ticker?: string | null
          total_invested?: number | null
          type?: Database["public"]["Enums"]["investment_type"]
          unrealized_pnl?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "investments_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "investments_currency_fkey"
            columns: ["currency"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "investments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      loan_payments: {
        Row: {
          amount: number
          amount_base: number | null
          balance_after: number
          created_at: string
          currency: string
          days_late: number | null
          fx_rate: number | null
          id: string
          installment_number: number | null
          interest_portion: number
          late_fee: number | null
          loan_id: string
          notes: string | null
          payment_date: string
          principal_portion: number
          scheduled_date: string | null
          transaction_id: string | null
          user_id: string
        }
        Insert: {
          amount: number
          amount_base?: number | null
          balance_after: number
          created_at?: string
          currency?: string
          days_late?: number | null
          fx_rate?: number | null
          id?: string
          installment_number?: number | null
          interest_portion: number
          late_fee?: number | null
          loan_id: string
          notes?: string | null
          payment_date: string
          principal_portion: number
          scheduled_date?: string | null
          transaction_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          amount_base?: number | null
          balance_after?: number
          created_at?: string
          currency?: string
          days_late?: number | null
          fx_rate?: number | null
          id?: string
          installment_number?: number | null
          interest_portion?: number
          late_fee?: number | null
          loan_id?: string
          notes?: string | null
          payment_date?: string
          principal_portion?: number
          scheduled_date?: string | null
          transaction_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "loan_payments_currency_fkey"
            columns: ["currency"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "loan_payments_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loan_portfolio"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loan_payments_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loan_payments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      loan_portfolio: {
        Row: {
          account_id: string | null
          amortization: Json | null
          amount_collected: number
          balance_pending: number
          borrower_email: string | null
          borrower_name: string
          borrower_phone: string | null
          contract_url: string | null
          created_at: string
          currency: string
          days_late_total: number
          deleted_at: string | null
          id: string
          interest_rate_monthly: number
          interest_type: string
          irr: number | null
          late_count: number
          late_fee_rate: number | null
          monthly_payment: number | null
          notes: string | null
          payment_day: number
          principal: number
          start_date: string
          status: Database["public"]["Enums"]["loan_status"]
          term_months: number
          total_interest: number | null
          total_to_collect: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          account_id?: string | null
          amortization?: Json | null
          amount_collected?: number
          balance_pending: number
          borrower_email?: string | null
          borrower_name: string
          borrower_phone?: string | null
          contract_url?: string | null
          created_at?: string
          currency?: string
          days_late_total?: number
          deleted_at?: string | null
          id?: string
          interest_rate_monthly: number
          interest_type?: string
          irr?: number | null
          late_count?: number
          late_fee_rate?: number | null
          monthly_payment?: number | null
          notes?: string | null
          payment_day: number
          principal: number
          start_date: string
          status?: Database["public"]["Enums"]["loan_status"]
          term_months: number
          total_interest?: number | null
          total_to_collect?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          account_id?: string | null
          amortization?: Json | null
          amount_collected?: number
          balance_pending?: number
          borrower_email?: string | null
          borrower_name?: string
          borrower_phone?: string | null
          contract_url?: string | null
          created_at?: string
          currency?: string
          days_late_total?: number
          deleted_at?: string | null
          id?: string
          interest_rate_monthly?: number
          interest_type?: string
          irr?: number | null
          late_count?: number
          late_fee_rate?: number | null
          monthly_payment?: number | null
          notes?: string | null
          payment_day?: number
          principal?: number
          start_date?: string
          status?: Database["public"]["Enums"]["loan_status"]
          term_months?: number
          total_interest?: number | null
          total_to_collect?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "loan_portfolio_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loan_portfolio_currency_fkey"
            columns: ["currency"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "loan_portfolio_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      manual_assets: {
        Row: {
          acquired_date: string | null
          appreciation_rate_yr: number | null
          created_at: string
          currency: string
          id: string
          is_active: boolean
          name: string
          notes: string | null
          type: Database["public"]["Enums"]["asset_type"]
          updated_at: string
          user_id: string
          value: number
        }
        Insert: {
          acquired_date?: string | null
          appreciation_rate_yr?: number | null
          created_at?: string
          currency?: string
          id?: string
          is_active?: boolean
          name: string
          notes?: string | null
          type: Database["public"]["Enums"]["asset_type"]
          updated_at?: string
          user_id: string
          value: number
        }
        Update: {
          acquired_date?: string | null
          appreciation_rate_yr?: number | null
          created_at?: string
          currency?: string
          id?: string
          is_active?: boolean
          name?: string
          notes?: string | null
          type?: Database["public"]["Enums"]["asset_type"]
          updated_at?: string
          user_id?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "manual_assets_currency_fkey"
            columns: ["currency"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "manual_assets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      manual_liabilities: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          is_active: boolean
          name: string
          notes: string | null
          type: Database["public"]["Enums"]["liability_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          id?: string
          is_active?: boolean
          name: string
          notes?: string | null
          type: Database["public"]["Enums"]["liability_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          is_active?: boolean
          name?: string
          notes?: string | null
          type?: Database["public"]["Enums"]["liability_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "manual_liabilities_currency_fkey"
            columns: ["currency"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "manual_liabilities_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      net_worth_snapshots: {
        Row: {
          assets_breakdown: Json
          created_at: string
          currency: string
          delta_amount: number | null
          delta_pct: number | null
          id: string
          liabilities_breakdown: Json
          net_worth: number | null
          snapshot_date: string
          source: string
          total_assets: number
          total_liabilities: number
          user_id: string
        }
        Insert: {
          assets_breakdown: Json
          created_at?: string
          currency?: string
          delta_amount?: number | null
          delta_pct?: number | null
          id?: string
          liabilities_breakdown: Json
          net_worth?: number | null
          snapshot_date: string
          source?: string
          total_assets: number
          total_liabilities: number
          user_id: string
        }
        Update: {
          assets_breakdown?: Json
          created_at?: string
          currency?: string
          delta_amount?: number | null
          delta_pct?: number | null
          id?: string
          liabilities_breakdown?: Json
          net_worth?: number | null
          snapshot_date?: string
          source?: string
          total_assets?: number
          total_liabilities?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "net_worth_snapshots_currency_fkey"
            columns: ["currency"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "net_worth_snapshots_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_label: string | null
          action_url: string | null
          body: string
          channel: Database["public"]["Enums"]["notification_channel"]
          created_at: string
          delivered_at: string | null
          failed_reason: string | null
          id: string
          kind: Database["public"]["Enums"]["alert_kind"] | null
          metadata: Json | null
          read_at: string | null
          related_entity_id: string | null
          related_entity_type: string | null
          scheduled_for: string
          sent_at: string | null
          severity: Database["public"]["Enums"]["alert_severity"]
          status: Database["public"]["Enums"]["notification_status"]
          title: string
          user_id: string
        }
        Insert: {
          action_label?: string | null
          action_url?: string | null
          body: string
          channel: Database["public"]["Enums"]["notification_channel"]
          created_at?: string
          delivered_at?: string | null
          failed_reason?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["alert_kind"] | null
          metadata?: Json | null
          read_at?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          scheduled_for?: string
          sent_at?: string | null
          severity?: Database["public"]["Enums"]["alert_severity"]
          status?: Database["public"]["Enums"]["notification_status"]
          title: string
          user_id: string
        }
        Update: {
          action_label?: string | null
          action_url?: string | null
          body?: string
          channel?: Database["public"]["Enums"]["notification_channel"]
          created_at?: string
          delivered_at?: string | null
          failed_reason?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["alert_kind"] | null
          metadata?: Json | null
          read_at?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          scheduled_for?: string
          sent_at?: string | null
          severity?: Database["public"]["Enums"]["alert_severity"]
          status?: Database["public"]["Enums"]["notification_status"]
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      recurrings: {
        Row: {
          account_id: string | null
          amount: number
          auto_create: boolean
          card_id: string | null
          category_id: string | null
          created_at: string
          currency: string
          day_of_month: number | null
          day_of_week: number | null
          end_date: string | null
          frequency: Database["public"]["Enums"]["recurrence_freq"]
          id: string
          is_active: boolean
          kind: Database["public"]["Enums"]["transaction_kind"]
          name: string
          next_run_date: string
          notify_before_days: number | null
          source_metadata: Json | null
          source_type: string | null
          start_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          account_id?: string | null
          amount: number
          auto_create?: boolean
          card_id?: string | null
          category_id?: string | null
          created_at?: string
          currency?: string
          day_of_month?: number | null
          day_of_week?: number | null
          end_date?: string | null
          frequency: Database["public"]["Enums"]["recurrence_freq"]
          id?: string
          is_active?: boolean
          kind: Database["public"]["Enums"]["transaction_kind"]
          name: string
          next_run_date: string
          notify_before_days?: number | null
          source_metadata?: Json | null
          source_type?: string | null
          start_date: string
          updated_at?: string
          user_id: string
        }
        Update: {
          account_id?: string | null
          amount?: number
          auto_create?: boolean
          card_id?: string | null
          category_id?: string | null
          created_at?: string
          currency?: string
          day_of_month?: number | null
          day_of_week?: number | null
          end_date?: string | null
          frequency?: Database["public"]["Enums"]["recurrence_freq"]
          id?: string
          is_active?: boolean
          kind?: Database["public"]["Enums"]["transaction_kind"]
          name?: string
          next_run_date?: string
          notify_before_days?: number | null
          source_metadata?: Json | null
          source_type?: string | null
          start_date?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recurrings_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurrings_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "credit_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurrings_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurrings_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "v_user_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurrings_currency_fkey"
            columns: ["currency"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "recurrings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      simulations: {
        Row: {
          baseline_snapshot: Json | null
          computed_impacts: Json
          created_at: string
          decision_at: string | null
          decision_notes: string | null
          decision_taken: string | null
          finn_insight: string | null
          finn_recommendation: string | null
          horizon_months: number
          id: string
          input_variables: Json
          scenario_type: Database["public"]["Enums"]["simulation_scenario"]
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          baseline_snapshot?: Json | null
          computed_impacts: Json
          created_at?: string
          decision_at?: string | null
          decision_notes?: string | null
          decision_taken?: string | null
          finn_insight?: string | null
          finn_recommendation?: string | null
          horizon_months?: number
          id?: string
          input_variables: Json
          scenario_type: Database["public"]["Enums"]["simulation_scenario"]
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          baseline_snapshot?: Json | null
          computed_impacts?: Json
          created_at?: string
          decision_at?: string | null
          decision_notes?: string | null
          decision_taken?: string | null
          finn_insight?: string | null
          finn_recommendation?: string | null
          horizon_months?: number
          id?: string
          input_variables?: Json
          scenario_type?: Database["public"]["Enums"]["simulation_scenario"]
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "simulations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      streaks: {
        Row: {
          current_count: number
          id: string
          kind: string
          last_increment_date: string | null
          longest_count: number
          started_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          current_count?: number
          id?: string
          kind: string
          last_increment_date?: string | null
          longest_count?: number
          started_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          current_count?: number
          id?: string
          kind?: string
          last_increment_date?: string | null
          longest_count?: number
          started_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "streaks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          account_id: string | null
          amount: number
          cancel_url: string | null
          card_id: string | null
          category_id: string | null
          created_at: string
          currency: string
          detected_automatically: boolean
          end_date: string | null
          free_trial_until: string | null
          frequency: Database["public"]["Enums"]["recurrence_freq"]
          id: string
          is_active: boolean
          next_charge_date: string
          notes: string | null
          plan: string | null
          recurring_id: string | null
          service_name: string
          start_date: string
          updated_at: string
          usage_score: number | null
          user_id: string
        }
        Insert: {
          account_id?: string | null
          amount: number
          cancel_url?: string | null
          card_id?: string | null
          category_id?: string | null
          created_at?: string
          currency?: string
          detected_automatically?: boolean
          end_date?: string | null
          free_trial_until?: string | null
          frequency?: Database["public"]["Enums"]["recurrence_freq"]
          id?: string
          is_active?: boolean
          next_charge_date: string
          notes?: string | null
          plan?: string | null
          recurring_id?: string | null
          service_name: string
          start_date: string
          updated_at?: string
          usage_score?: number | null
          user_id: string
        }
        Update: {
          account_id?: string | null
          amount?: number
          cancel_url?: string | null
          card_id?: string | null
          category_id?: string | null
          created_at?: string
          currency?: string
          detected_automatically?: boolean
          end_date?: string | null
          free_trial_until?: string | null
          frequency?: Database["public"]["Enums"]["recurrence_freq"]
          id?: string
          is_active?: boolean
          next_charge_date?: string
          notes?: string | null
          plan?: string | null
          recurring_id?: string | null
          service_name?: string
          start_date?: string
          updated_at?: string
          usage_score?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "credit_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "v_user_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_currency_fkey"
            columns: ["currency"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "subscriptions_recurring_id_fkey"
            columns: ["recurring_id"]
            isOneToOne: false
            referencedRelation: "recurrings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      tax_records: {
        Row: {
          amount: number
          created_at: string
          currency: string
          deduction_category: string | null
          fiscal_month: number | null
          fiscal_period: string | null
          fiscal_year: number
          id: string
          income_entry_id: string | null
          income_tax_amount: number | null
          invoice_number: string | null
          invoice_type: string | null
          invoice_url: string | null
          invoice_uuid: string | null
          is_validated: boolean
          issuer_name: string | null
          issuer_tax_id: string | null
          notes: string | null
          receiver_tax_id: string | null
          transaction_id: string | null
          type: Database["public"]["Enums"]["tax_record_type"]
          updated_at: string
          user_id: string
          vat_amount: number | null
          withholding_amount: number | null
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          deduction_category?: string | null
          fiscal_month?: number | null
          fiscal_period?: string | null
          fiscal_year: number
          id?: string
          income_entry_id?: string | null
          income_tax_amount?: number | null
          invoice_number?: string | null
          invoice_type?: string | null
          invoice_url?: string | null
          invoice_uuid?: string | null
          is_validated?: boolean
          issuer_name?: string | null
          issuer_tax_id?: string | null
          notes?: string | null
          receiver_tax_id?: string | null
          transaction_id?: string | null
          type: Database["public"]["Enums"]["tax_record_type"]
          updated_at?: string
          user_id: string
          vat_amount?: number | null
          withholding_amount?: number | null
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          deduction_category?: string | null
          fiscal_month?: number | null
          fiscal_period?: string | null
          fiscal_year?: number
          id?: string
          income_entry_id?: string | null
          income_tax_amount?: number | null
          invoice_number?: string | null
          invoice_type?: string | null
          invoice_url?: string | null
          invoice_uuid?: string | null
          is_validated?: boolean
          issuer_name?: string | null
          issuer_tax_id?: string | null
          notes?: string | null
          receiver_tax_id?: string | null
          transaction_id?: string | null
          type?: Database["public"]["Enums"]["tax_record_type"]
          updated_at?: string
          user_id?: string
          vat_amount?: number | null
          withholding_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "tax_records_currency_fkey"
            columns: ["currency"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "tax_records_income_fk"
            columns: ["income_entry_id"]
            isOneToOne: false
            referencedRelation: "income_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tax_records_transaction_fk"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tax_records_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          account_id: string | null
          ai_category_id: string | null
          ai_confidence: number | null
          amount: number
          amount_base: number | null
          capture_source: Database["public"]["Enums"]["capture_source"]
          card_id: string | null
          category_id: string | null
          collab_space_id: string | null
          created_at: string
          currency: string
          deleted_at: string | null
          deleted_by: string | null
          description: string | null
          fx_rate: number | null
          fx_rate_date: string | null
          goal_id: string | null
          id: string
          is_split: boolean
          is_tax_deductible: boolean
          kind: Database["public"]["Enums"]["transaction_kind"]
          location: Json | null
          merchant_name: string | null
          money_class_override:
            | Database["public"]["Enums"]["money_class"]
            | null
          notes: string | null
          paid_by_user_id: string | null
          posted_at: string | null
          receipt_ocr_data: Json | null
          receipt_url: string | null
          recurring_id: string | null
          reference: string | null
          split_details: Json | null
          split_parent_id: string | null
          status: Database["public"]["Enums"]["transaction_status"]
          tags: string[] | null
          tax_record_id: string | null
          transaction_date: string
          transfer_pair_id: string | null
          trip_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          account_id?: string | null
          ai_category_id?: string | null
          ai_confidence?: number | null
          amount: number
          amount_base?: number | null
          capture_source?: Database["public"]["Enums"]["capture_source"]
          card_id?: string | null
          category_id?: string | null
          collab_space_id?: string | null
          created_at?: string
          currency?: string
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string | null
          fx_rate?: number | null
          fx_rate_date?: string | null
          goal_id?: string | null
          id?: string
          is_split?: boolean
          is_tax_deductible?: boolean
          kind: Database["public"]["Enums"]["transaction_kind"]
          location?: Json | null
          merchant_name?: string | null
          money_class_override?:
            | Database["public"]["Enums"]["money_class"]
            | null
          notes?: string | null
          paid_by_user_id?: string | null
          posted_at?: string | null
          receipt_ocr_data?: Json | null
          receipt_url?: string | null
          recurring_id?: string | null
          reference?: string | null
          split_details?: Json | null
          split_parent_id?: string | null
          status?: Database["public"]["Enums"]["transaction_status"]
          tags?: string[] | null
          tax_record_id?: string | null
          transaction_date: string
          transfer_pair_id?: string | null
          trip_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          account_id?: string | null
          ai_category_id?: string | null
          ai_confidence?: number | null
          amount?: number
          amount_base?: number | null
          capture_source?: Database["public"]["Enums"]["capture_source"]
          card_id?: string | null
          category_id?: string | null
          collab_space_id?: string | null
          created_at?: string
          currency?: string
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string | null
          fx_rate?: number | null
          fx_rate_date?: string | null
          goal_id?: string | null
          id?: string
          is_split?: boolean
          is_tax_deductible?: boolean
          kind?: Database["public"]["Enums"]["transaction_kind"]
          location?: Json | null
          merchant_name?: string | null
          money_class_override?:
            | Database["public"]["Enums"]["money_class"]
            | null
          notes?: string | null
          paid_by_user_id?: string | null
          posted_at?: string | null
          receipt_ocr_data?: Json | null
          receipt_url?: string | null
          recurring_id?: string | null
          reference?: string | null
          split_details?: Json | null
          split_parent_id?: string | null
          status?: Database["public"]["Enums"]["transaction_status"]
          tags?: string[] | null
          tax_record_id?: string | null
          transaction_date?: string
          transfer_pair_id?: string | null
          trip_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_ai_category_id_fkey"
            columns: ["ai_category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_ai_category_id_fkey"
            columns: ["ai_category_id"]
            isOneToOne: false
            referencedRelation: "v_user_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "credit_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "v_user_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_collab_space_id_fkey"
            columns: ["collab_space_id"]
            isOneToOne: false
            referencedRelation: "collab_spaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_currency_fkey"
            columns: ["currency"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "transactions_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_paid_by_user_id_fkey"
            columns: ["paid_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_recurring_id_fkey"
            columns: ["recurring_id"]
            isOneToOne: false
            referencedRelation: "recurrings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_split_parent_id_fkey"
            columns: ["split_parent_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_tax_record_id_fkey"
            columns: ["tax_record_id"]
            isOneToOne: false
            referencedRelation: "tax_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_transfer_pair_id_fkey"
            columns: ["transfer_pair_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_expenses: {
        Row: {
          amount_home: number | null
          amount_local: number
          category: Database["public"]["Enums"]["trip_expense_category"]
          created_at: string
          currency_home: string | null
          currency_local: string
          description: string
          expense_date: string
          fx_rate: number | null
          id: string
          location: Json | null
          notes: string | null
          receipt_url: string | null
          transaction_id: string | null
          trip_id: string
          user_id: string
        }
        Insert: {
          amount_home?: number | null
          amount_local: number
          category: Database["public"]["Enums"]["trip_expense_category"]
          created_at?: string
          currency_home?: string | null
          currency_local: string
          description: string
          expense_date: string
          fx_rate?: number | null
          id?: string
          location?: Json | null
          notes?: string | null
          receipt_url?: string | null
          transaction_id?: string | null
          trip_id: string
          user_id: string
        }
        Update: {
          amount_home?: number | null
          amount_local?: number
          category?: Database["public"]["Enums"]["trip_expense_category"]
          created_at?: string
          currency_home?: string | null
          currency_local?: string
          description?: string
          expense_date?: string
          fx_rate?: number | null
          id?: string
          location?: Json | null
          notes?: string | null
          receipt_url?: string | null
          transaction_id?: string | null
          trip_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_expenses_currency_home_fkey"
            columns: ["currency_home"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "trip_expenses_currency_local_fkey"
            columns: ["currency_local"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "trip_expenses_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_expenses_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_expenses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      trips: {
        Row: {
          actual_spent: number
          ai_itinerary: Json | null
          budget: number
          budget_currency: string
          collab_space_id: string | null
          cover_image_url: string | null
          created_at: string
          destination: string
          destination_country: string | null
          destination_currency: string | null
          destination_info: Json | null
          end_date: string
          flight_info: Json | null
          goal_id: string | null
          id: string
          lodging_info: Json | null
          notes: string | null
          start_date: string
          status: Database["public"]["Enums"]["trip_status"]
          travelers_count: number
          updated_at: string
          user_id: string
        }
        Insert: {
          actual_spent?: number
          ai_itinerary?: Json | null
          budget: number
          budget_currency?: string
          collab_space_id?: string | null
          cover_image_url?: string | null
          created_at?: string
          destination: string
          destination_country?: string | null
          destination_currency?: string | null
          destination_info?: Json | null
          end_date: string
          flight_info?: Json | null
          goal_id?: string | null
          id?: string
          lodging_info?: Json | null
          notes?: string | null
          start_date: string
          status?: Database["public"]["Enums"]["trip_status"]
          travelers_count?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          actual_spent?: number
          ai_itinerary?: Json | null
          budget?: number
          budget_currency?: string
          collab_space_id?: string | null
          cover_image_url?: string | null
          created_at?: string
          destination?: string
          destination_country?: string | null
          destination_currency?: string | null
          destination_info?: Json | null
          end_date?: string
          flight_info?: Json | null
          goal_id?: string | null
          id?: string
          lodging_info?: Json | null
          notes?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["trip_status"]
          travelers_count?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trips_budget_currency_fkey"
            columns: ["budget_currency"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "trips_collab_space_id_fkey"
            columns: ["collab_space_id"]
            isOneToOne: false
            referencedRelation: "collab_spaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trips_destination_currency_fkey"
            columns: ["destination_currency"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "trips_goal_fk"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trips_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_achievements: {
        Row: {
          achievement_id: string
          context_snapshot: Json | null
          earned_at: string
          id: string
          notified_at: string | null
          user_id: string
        }
        Insert: {
          achievement_id: string
          context_snapshot?: Json | null
          earned_at?: string
          id?: string
          notified_at?: string | null
          user_id: string
        }
        Update: {
          achievement_id?: string
          context_snapshot?: Json | null
          earned_at?: string
          id?: string
          notified_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_achievements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_hidden_categories: {
        Row: {
          category_id: string
          hidden_at: string
          user_id: string
        }
        Insert: {
          category_id: string
          hidden_at?: string
          user_id: string
        }
        Update: {
          category_id?: string
          hidden_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_hidden_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_hidden_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "v_user_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_hidden_categories_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_settings: {
        Row: {
          budget_mode_default: Database["public"]["Enums"]["budget_mode"]
          created_at: string
          dashboard_widgets: Json
          default_account_id: string | null
          default_category_id: string | null
          finn_daily_brief_at: string
          finn_personality: string
          finn_proactive: boolean
          hide_zero_balances: boolean
          notif_channels: Json
          notif_quiet_hours: Json | null
          receipt_auto_attach: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          budget_mode_default?: Database["public"]["Enums"]["budget_mode"]
          created_at?: string
          dashboard_widgets?: Json
          default_account_id?: string | null
          default_category_id?: string | null
          finn_daily_brief_at?: string
          finn_personality?: string
          finn_proactive?: boolean
          hide_zero_balances?: boolean
          notif_channels?: Json
          notif_quiet_hours?: Json | null
          receipt_auto_attach?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          budget_mode_default?: Database["public"]["Enums"]["budget_mode"]
          created_at?: string
          dashboard_widgets?: Json
          default_account_id?: string | null
          default_category_id?: string | null
          finn_daily_brief_at?: string
          finn_personality?: string
          finn_proactive?: boolean
          hide_zero_balances?: boolean
          notif_channels?: Json
          notif_quiet_hours?: Json | null
          receipt_auto_attach?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          birth_date: string | null
          country: string
          created_at: string
          crisis_mode: boolean
          currency_default: string
          data_export_at: string | null
          deleted_at: string | null
          display_name: string
          email: string
          flow_score: number
          id: string
          is_superadmin: boolean
          language: string
          marketing_consent: boolean
          monthly_income_est: number | null
          occupation: string | null
          onboarding_done: boolean
          phone: string | null
          plan: Database["public"]["Enums"]["plan_tier"]
          privacy_mode: boolean
          tax_id: string | null
          tax_regime: string | null
          timezone: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          birth_date?: string | null
          country?: string
          created_at?: string
          crisis_mode?: boolean
          currency_default?: string
          data_export_at?: string | null
          deleted_at?: string | null
          display_name: string
          email: string
          flow_score?: number
          id: string
          is_superadmin?: boolean
          language?: string
          marketing_consent?: boolean
          monthly_income_est?: number | null
          occupation?: string | null
          onboarding_done?: boolean
          phone?: string | null
          plan?: Database["public"]["Enums"]["plan_tier"]
          privacy_mode?: boolean
          tax_id?: string | null
          tax_regime?: string | null
          timezone?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          birth_date?: string | null
          country?: string
          created_at?: string
          crisis_mode?: boolean
          currency_default?: string
          data_export_at?: string | null
          deleted_at?: string | null
          display_name?: string
          email?: string
          flow_score?: number
          id?: string
          is_superadmin?: boolean
          language?: string
          marketing_consent?: boolean
          monthly_income_est?: number | null
          occupation?: string | null
          onboarding_done?: boolean
          phone?: string | null
          plan?: Database["public"]["Enums"]["plan_tier"]
          privacy_mode?: boolean
          tax_id?: string | null
          tax_regime?: string | null
          timezone?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_currency_default_fkey"
            columns: ["currency_default"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["code"]
          },
        ]
      }
    }
    Views: {
      v_net_worth_current: {
        Row: {
          assets_breakdown: Json | null
          currency: string | null
          liabilities_breakdown: Json | null
          net_worth: number | null
          total_assets: number | null
          total_liabilities: number | null
          user_id: string | null
        }
        Relationships: []
      }
      v_user_categories: {
        Row: {
          archived_at: string | null
          color: string | null
          created_at: string | null
          icon: string | null
          id: string | null
          is_system: boolean | null
          is_tax_deductible: boolean | null
          money_class: Database["public"]["Enums"]["money_class"] | null
          name: string | null
          parent_id: string | null
          sort_order: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          archived_at?: string | null
          color?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string | null
          is_system?: boolean | null
          is_tax_deductible?: boolean | null
          money_class?: Database["public"]["Enums"]["money_class"] | null
          name?: string | null
          parent_id?: string | null
          sort_order?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          archived_at?: string | null
          color?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string | null
          is_system?: boolean | null
          is_tax_deductible?: boolean | null
          money_class?: Database["public"]["Enums"]["money_class"] | null
          name?: string | null
          parent_id?: string | null
          sort_order?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "v_user_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "categories_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      cc_balance_delta: {
        Args: {
          p_amount: number
          p_kind: Database["public"]["Enums"]["transaction_kind"]
        }
        Returns: number
      }
      get_fx_rate: {
        Args: { p_date: string; p_from: string; p_to: string }
        Returns: number
      }
      is_collab_member: { Args: { p_space_id: string }; Returns: boolean }
      resolve_budget_category_id: {
        Args: { p_category_id: string }
        Returns: string
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      to_base_currency: {
        Args: {
          p_amount: number
          p_currency: string
          p_date: string
          p_user_id: string
        }
        Returns: number
      }
      transaction_balance_delta: {
        Args: {
          p_amount: number
          p_kind: Database["public"]["Enums"]["transaction_kind"]
        }
        Returns: number
      }
    }
    Enums: {
      account_status: "active" | "closed" | "archived"
      account_type:
        | "checking"
        | "savings"
        | "cash"
        | "credit_card"
        | "investment"
        | "digital_wallet"
        | "fx"
        | "virtual"
      achievement_category:
        | "savings"
        | "budget"
        | "debt"
        | "income"
        | "investment"
        | "consistency"
        | "milestone"
        | "social"
      alert_kind:
        | "budget_threshold"
        | "cc_cutoff"
        | "cc_payment_due"
        | "bill_due"
        | "loan_overdue"
        | "goal_off_track"
        | "unusual_spending"
        | "low_balance"
        | "subscription_renewal"
        | "large_transaction"
        | "income_received"
        | "achievement_unlocked"
        | "budget_projection"
        | "budget_completed"
        | "savings_opportunity"
        | "month_start"
        | "spending_increase"
        | "streak_achievement"
        | "rollover_available"
        | "crisis_mode"
        | "subscription_price_change"
        | "subscription_unused"
        | "goal_completed"
        | "investment_maturing"
        | "anomaly_detected"
        | "debt_minimum_risk"
        | "tax_deadline"
      alert_severity: "info" | "warning" | "critical"
      asset_type:
        | "cash"
        | "investment"
        | "real_estate"
        | "vehicle"
        | "collectible"
        | "crypto"
        | "other"
      audit_action:
        | "delete"
        | "restore"
        | "export"
        | "login"
        | "logout"
        | "consent_change"
      billing_status:
        | "trialing"
        | "active"
        | "past_due"
        | "canceled"
        | "incomplete"
        | "paused"
      budget_mode: "zero_based" | "flexible" | "50_30_20"
      budget_status: "on_track" | "warning" | "over"
      capture_source:
        | "manual"
        | "csv_import"
        | "ocr_receipt"
        | "voice"
        | "open_banking"
        | "recurring"
        | "finn"
      collab_kind: "couple" | "family" | "roommates" | "business" | "other"
      collab_role: "owner" | "admin" | "member" | "viewer"
      collab_status: "invited" | "active" | "removed" | "left"
      debt_strategy: "snowball" | "avalanche" | "custom"
      family_payment_method:
        | "cash"
        | "transfer"
        | "in_kind"
        | "service"
        | "mixed"
      finn_session_kind:
        | "onboarding"
        | "daily_brief"
        | "chat"
        | "simulator"
        | "goal_planning"
        | "budget_review"
      goal_status: "active" | "paused" | "completed" | "abandoned"
      goal_type:
        | "emergency_fund"
        | "savings"
        | "debt_payoff"
        | "purchase"
        | "travel"
        | "education"
        | "retirement"
        | "other"
      income_type:
        | "salary"
        | "freelance"
        | "rental"
        | "investment_yield"
        | "loan_payment"
        | "business"
        | "eventual"
        | "other"
      investment_type:
        | "stock"
        | "etf"
        | "mutual_fund"
        | "bond"
        | "cete"
        | "crypto"
        | "real_estate"
        | "business_equity"
        | "other"
      liability_type:
        | "credit_card"
        | "personal_loan"
        | "mortgage"
        | "auto_loan"
        | "student_loan"
        | "other"
      loan_status:
        | "active"
        | "paid"
        | "defaulted"
        | "restructured"
        | "written_off"
      money_class: "need" | "want" | "savings_debt"
      notification_channel: "in_app" | "email" | "push" | "whatsapp" | "sms"
      notification_status: "pending" | "sent" | "delivered" | "read" | "failed"
      plan_tier: "free" | "starter" | "pro" | "elite"
      recurrence_freq:
        | "daily"
        | "weekly"
        | "biweekly"
        | "monthly"
        | "bimonthly"
        | "quarterly"
        | "semiannual"
        | "annual"
      simulation_scenario:
        | "job_loss"
        | "salary_increase"
        | "big_purchase"
        | "pay_off_debt"
        | "invest_lump_sum"
        | "start_business"
        | "have_child"
        | "buy_house"
        | "sell_asset"
        | "early_retirement"
        | "travel_planning"
        | "education_cost"
        | "medical_emergency"
        | "inheritance"
        | "lottery_win"
        | "rate_change"
        | "fx_change"
        | "inflation_spike"
        | "recession"
        | "gift_received"
        | "gift_given"
        | "subscription_review"
        | "side_hustle"
        | "custom"
      tax_record_type:
        | "income_declaration"
        | "deductible_expense"
        | "isr_withheld"
        | "iva_paid"
        | "iva_collected"
      transaction_kind:
        | "expense"
        | "income"
        | "transfer_out"
        | "transfer_in"
        | "cc_payment"
        | "cc_charge"
        | "cc_cash_advance"
        | "fee"
        | "interest_earned"
        | "interest_paid"
        | "refund"
        | "adjustment"
      transaction_status: "pending" | "cleared" | "reconciled" | "void"
      trip_expense_category:
        | "transport"
        | "lodging"
        | "food"
        | "activities"
        | "shopping"
        | "fees"
        | "insurance"
        | "other"
      trip_status: "planning" | "active" | "completed" | "cancelled"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  storage: {
    Tables: {
      buckets: {
        Row: {
          allowed_mime_types: string[] | null
          avif_autodetection: boolean | null
          created_at: string | null
          file_size_limit: number | null
          id: string
          name: string
          owner: string | null
          owner_id: string | null
          public: boolean | null
          type: Database["storage"]["Enums"]["buckettype"]
          updated_at: string | null
        }
        Insert: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id: string
          name: string
          owner?: string | null
          owner_id?: string | null
          public?: boolean | null
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string | null
        }
        Update: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id?: string
          name?: string
          owner?: string | null
          owner_id?: string | null
          public?: boolean | null
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string | null
        }
        Relationships: []
      }
      buckets_analytics: {
        Row: {
          created_at: string
          deleted_at: string | null
          format: string
          id: string
          name: string
          type: Database["storage"]["Enums"]["buckettype"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          format?: string
          id?: string
          name: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          format?: string
          id?: string
          name?: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Relationships: []
      }
      buckets_vectors: {
        Row: {
          created_at: string
          id: string
          type: Database["storage"]["Enums"]["buckettype"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Relationships: []
      }
      migrations: {
        Row: {
          executed_at: string | null
          hash: string
          id: number
          name: string
        }
        Insert: {
          executed_at?: string | null
          hash: string
          id: number
          name: string
        }
        Update: {
          executed_at?: string | null
          hash?: string
          id?: number
          name?: string
        }
        Relationships: []
      }
      objects: {
        Row: {
          bucket_id: string | null
          created_at: string | null
          id: string
          last_accessed_at: string | null
          metadata: Json | null
          name: string | null
          owner: string | null
          owner_id: string | null
          path_tokens: string[] | null
          updated_at: string | null
          user_metadata: Json | null
          version: string | null
        }
        Insert: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          owner_id?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          user_metadata?: Json | null
          version?: string | null
        }
        Update: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          owner_id?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          user_metadata?: Json | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "objects_bucketId_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
        ]
      }
      s3_multipart_uploads: {
        Row: {
          bucket_id: string
          created_at: string
          id: string
          in_progress_size: number
          key: string
          metadata: Json | null
          owner_id: string | null
          upload_signature: string
          user_metadata: Json | null
          version: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          id: string
          in_progress_size?: number
          key: string
          metadata?: Json | null
          owner_id?: string | null
          upload_signature: string
          user_metadata?: Json | null
          version: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          id?: string
          in_progress_size?: number
          key?: string
          metadata?: Json | null
          owner_id?: string | null
          upload_signature?: string
          user_metadata?: Json | null
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "s3_multipart_uploads_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
        ]
      }
      s3_multipart_uploads_parts: {
        Row: {
          bucket_id: string
          created_at: string
          etag: string
          id: string
          key: string
          owner_id: string | null
          part_number: number
          size: number
          upload_id: string
          version: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          etag: string
          id?: string
          key: string
          owner_id?: string | null
          part_number: number
          size?: number
          upload_id: string
          version: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          etag?: string
          id?: string
          key?: string
          owner_id?: string | null
          part_number?: number
          size?: number
          upload_id?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "s3_multipart_uploads_parts_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "s3_multipart_uploads_parts_upload_id_fkey"
            columns: ["upload_id"]
            isOneToOne: false
            referencedRelation: "s3_multipart_uploads"
            referencedColumns: ["id"]
          },
        ]
      }
      vector_indexes: {
        Row: {
          bucket_id: string
          created_at: string
          data_type: string
          dimension: number
          distance_metric: string
          id: string
          metadata_configuration: Json | null
          name: string
          updated_at: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          data_type: string
          dimension: number
          distance_metric: string
          id?: string
          metadata_configuration?: Json | null
          name: string
          updated_at?: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          data_type?: string
          dimension?: number
          distance_metric?: string
          id?: string
          metadata_configuration?: Json | null
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "vector_indexes_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets_vectors"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      allow_any_operation: {
        Args: { expected_operations: string[] }
        Returns: boolean
      }
      allow_only_operation: {
        Args: { expected_operation: string }
        Returns: boolean
      }
      can_insert_object: {
        Args: { bucketid: string; metadata: Json; name: string; owner: string }
        Returns: undefined
      }
      extension: { Args: { name: string }; Returns: string }
      filename: { Args: { name: string }; Returns: string }
      foldername: { Args: { name: string }; Returns: string[] }
      get_common_prefix: {
        Args: { p_delimiter: string; p_key: string; p_prefix: string }
        Returns: string
      }
      get_size_by_bucket: {
        Args: never
        Returns: {
          bucket_id: string
          size: number
        }[]
      }
      list_multipart_uploads_with_delimiter: {
        Args: {
          bucket_id: string
          delimiter_param: string
          max_keys?: number
          next_key_token?: string
          next_upload_token?: string
          prefix_param: string
        }
        Returns: {
          created_at: string
          id: string
          key: string
        }[]
      }
      list_objects_with_delimiter: {
        Args: {
          _bucket_id: string
          delimiter_param: string
          max_keys?: number
          next_token?: string
          prefix_param: string
          sort_order?: string
          start_after?: string
        }
        Returns: {
          created_at: string
          id: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      operation: { Args: never; Returns: string }
      search: {
        Args: {
          bucketname: string
          levels?: number
          limits?: number
          offsets?: number
          prefix: string
          search?: string
          sortcolumn?: string
          sortorder?: string
        }
        Returns: {
          created_at: string
          id: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      search_by_timestamp: {
        Args: {
          p_bucket_id: string
          p_level: number
          p_limit: number
          p_prefix: string
          p_sort_column: string
          p_sort_column_after: string
          p_sort_order: string
          p_start_after: string
        }
        Returns: {
          created_at: string
          id: string
          key: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      search_v2: {
        Args: {
          bucket_name: string
          levels?: number
          limits?: number
          prefix: string
          sort_column?: string
          sort_column_after?: string
          sort_order?: string
          start_after?: string
        }
        Returns: {
          created_at: string
          id: string
          key: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
    }
    Enums: {
      buckettype: "STANDARD" | "ANALYTICS" | "VECTOR"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      account_status: ["active", "closed", "archived"],
      account_type: [
        "checking",
        "savings",
        "cash",
        "credit_card",
        "investment",
        "digital_wallet",
        "fx",
        "virtual",
      ],
      achievement_category: [
        "savings",
        "budget",
        "debt",
        "income",
        "investment",
        "consistency",
        "milestone",
        "social",
      ],
      alert_kind: [
        "budget_threshold",
        "cc_cutoff",
        "cc_payment_due",
        "bill_due",
        "loan_overdue",
        "goal_off_track",
        "unusual_spending",
        "low_balance",
        "subscription_renewal",
        "large_transaction",
        "income_received",
        "achievement_unlocked",
        "budget_projection",
        "budget_completed",
        "savings_opportunity",
        "month_start",
        "spending_increase",
        "streak_achievement",
        "rollover_available",
        "crisis_mode",
        "subscription_price_change",
        "subscription_unused",
        "goal_completed",
        "investment_maturing",
        "anomaly_detected",
        "debt_minimum_risk",
        "tax_deadline",
      ],
      alert_severity: ["info", "warning", "critical"],
      asset_type: [
        "cash",
        "investment",
        "real_estate",
        "vehicle",
        "collectible",
        "crypto",
        "other",
      ],
      audit_action: [
        "delete",
        "restore",
        "export",
        "login",
        "logout",
        "consent_change",
      ],
      billing_status: [
        "trialing",
        "active",
        "past_due",
        "canceled",
        "incomplete",
        "paused",
      ],
      budget_mode: ["zero_based", "flexible", "50_30_20"],
      budget_status: ["on_track", "warning", "over"],
      capture_source: [
        "manual",
        "csv_import",
        "ocr_receipt",
        "voice",
        "open_banking",
        "recurring",
        "finn",
      ],
      collab_kind: ["couple", "family", "roommates", "business", "other"],
      collab_role: ["owner", "admin", "member", "viewer"],
      collab_status: ["invited", "active", "removed", "left"],
      debt_strategy: ["snowball", "avalanche", "custom"],
      family_payment_method: [
        "cash",
        "transfer",
        "in_kind",
        "service",
        "mixed",
      ],
      finn_session_kind: [
        "onboarding",
        "daily_brief",
        "chat",
        "simulator",
        "goal_planning",
        "budget_review",
      ],
      goal_status: ["active", "paused", "completed", "abandoned"],
      goal_type: [
        "emergency_fund",
        "savings",
        "debt_payoff",
        "purchase",
        "travel",
        "education",
        "retirement",
        "other",
      ],
      income_type: [
        "salary",
        "freelance",
        "rental",
        "investment_yield",
        "loan_payment",
        "business",
        "eventual",
        "other",
      ],
      investment_type: [
        "stock",
        "etf",
        "mutual_fund",
        "bond",
        "cete",
        "crypto",
        "real_estate",
        "business_equity",
        "other",
      ],
      liability_type: [
        "credit_card",
        "personal_loan",
        "mortgage",
        "auto_loan",
        "student_loan",
        "other",
      ],
      loan_status: [
        "active",
        "paid",
        "defaulted",
        "restructured",
        "written_off",
      ],
      money_class: ["need", "want", "savings_debt"],
      notification_channel: ["in_app", "email", "push", "whatsapp", "sms"],
      notification_status: ["pending", "sent", "delivered", "read", "failed"],
      plan_tier: ["free", "starter", "pro", "elite"],
      recurrence_freq: [
        "daily",
        "weekly",
        "biweekly",
        "monthly",
        "bimonthly",
        "quarterly",
        "semiannual",
        "annual",
      ],
      simulation_scenario: [
        "job_loss",
        "salary_increase",
        "big_purchase",
        "pay_off_debt",
        "invest_lump_sum",
        "start_business",
        "have_child",
        "buy_house",
        "sell_asset",
        "early_retirement",
        "travel_planning",
        "education_cost",
        "medical_emergency",
        "inheritance",
        "lottery_win",
        "rate_change",
        "fx_change",
        "inflation_spike",
        "recession",
        "gift_received",
        "gift_given",
        "subscription_review",
        "side_hustle",
        "custom",
      ],
      tax_record_type: [
        "income_declaration",
        "deductible_expense",
        "isr_withheld",
        "iva_paid",
        "iva_collected",
      ],
      transaction_kind: [
        "expense",
        "income",
        "transfer_out",
        "transfer_in",
        "cc_payment",
        "cc_charge",
        "cc_cash_advance",
        "fee",
        "interest_earned",
        "interest_paid",
        "refund",
        "adjustment",
      ],
      transaction_status: ["pending", "cleared", "reconciled", "void"],
      trip_expense_category: [
        "transport",
        "lodging",
        "food",
        "activities",
        "shopping",
        "fees",
        "insurance",
        "other",
      ],
      trip_status: ["planning", "active", "completed", "cancelled"],
    },
  },
  storage: {
    Enums: {
      buckettype: ["STANDARD", "ANALYTICS", "VECTOR"],
    },
  },
} as const
