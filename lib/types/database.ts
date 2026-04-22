export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string;
          name: string;
          slug: string;
          mode: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          mode?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          mode?: string;
          created_at?: string;
        };
        Relationships: [
        ];
      };
      clubs: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          slug: string;
          active: boolean;
          timezone: string;
          currency: string;
          login_mode: string;
          telegram_bot_token: string | null;
          telegram_chat_id: string | null;
          invite_only: boolean;
          hide_member_login: boolean;
          tags: string[];
          claimed: boolean;
          spin_enabled: boolean;
          working_hours: Record<string, { open: string; close: string } | null> | null;
          spin_display_decimals: number;
          spin_cost: number;
          preregistration_enabled: boolean;
          operations_module_enabled: boolean;
          currency_mode: "saldo" | "cash";
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          slug: string;
          active?: boolean;
          timezone?: string;
          currency?: string;
          login_mode?: string;
          telegram_bot_token?: string | null;
          telegram_chat_id?: string | null;
          invite_only?: boolean;
          hide_member_login?: boolean;
          tags?: string[];
          claimed?: boolean;
          spin_enabled?: boolean;
          working_hours?: Record<string, { open: string; close: string } | null> | null;
          spin_display_decimals?: number;
          spin_cost?: number;
          preregistration_enabled?: boolean;
          operations_module_enabled?: boolean;
          currency_mode?: "saldo" | "cash";
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          name?: string;
          slug?: string;
          active?: boolean;
          timezone?: string;
          currency?: string;
          login_mode?: string;
          telegram_bot_token?: string | null;
          telegram_chat_id?: string | null;
          invite_only?: boolean;
          hide_member_login?: boolean;
          tags?: string[];
          claimed?: boolean;
          spin_enabled?: boolean;
          working_hours?: Record<string, { open: string; close: string } | null> | null;
          spin_display_decimals?: number;
          spin_cost?: number;
          preregistration_enabled?: boolean;
          operations_module_enabled?: boolean;
          currency_mode?: "saldo" | "cash";
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "clubs_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      club_branding: {
        Row: {
          id: string;
          club_id: string;
          logo_url: string | null;
          cover_url: string | null;
          theme_name: string;
          primary_color: string;
          secondary_color: string;
          hero_content: string | null;
          social_instagram: string | null;
          social_whatsapp: string | null;
          social_telegram: string | null;
          social_google_maps: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          club_id: string;
          logo_url?: string | null;
          cover_url?: string | null;
          theme_name?: string;
          primary_color?: string;
          secondary_color?: string;
          hero_content?: string | null;
          social_instagram?: string | null;
          social_whatsapp?: string | null;
          social_telegram?: string | null;
          social_google_maps?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          club_id?: string;
          logo_url?: string | null;
          cover_url?: string | null;
          theme_name?: string;
          primary_color?: string;
          secondary_color?: string;
          hero_content?: string | null;
          social_instagram?: string | null;
          social_whatsapp?: string | null;
          social_telegram?: string | null;
          social_google_maps?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "club_branding_club_id_fkey";
            columns: ["club_id"];
            isOneToOne: true;
            referencedRelation: "clubs";
            referencedColumns: ["id"];
          },
        ];
      };
      product_categories: {
        Row: {
          id: string;
          club_id: string;
          name: string;
          name_es: string | null;
          display_order: number;
          archived: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          club_id: string;
          name: string;
          name_es?: string | null;
          display_order?: number;
          archived?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          club_id?: string;
          name?: string;
          name_es?: string | null;
          display_order?: number;
          archived?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "product_categories_club_id_fkey";
            columns: ["club_id"];
            isOneToOne: false;
            referencedRelation: "clubs";
            referencedColumns: ["id"];
          },
        ];
      };
      products: {
        Row: {
          id: string;
          club_id: string;
          category_id: string | null;
          name: string;
          name_es: string | null;
          description: string | null;
          description_es: string | null;
          image_url: string | null;
          unit: "gram" | "piece";
          unit_price: number;
          cost_price: number;
          stock_on_hand: number;
          active: boolean;
          display_order: number;
          archived: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          club_id: string;
          category_id?: string | null;
          name: string;
          name_es?: string | null;
          description?: string | null;
          description_es?: string | null;
          image_url?: string | null;
          unit?: "gram" | "piece";
          unit_price?: number;
          cost_price?: number;
          stock_on_hand?: number;
          active?: boolean;
          display_order?: number;
          archived?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          club_id?: string;
          category_id?: string | null;
          name?: string;
          name_es?: string | null;
          description?: string | null;
          description_es?: string | null;
          image_url?: string | null;
          unit?: "gram" | "piece";
          unit_price?: number;
          cost_price?: number;
          stock_on_hand?: number;
          active?: boolean;
          display_order?: number;
          archived?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "products_club_id_fkey";
            columns: ["club_id"];
            isOneToOne: false;
            referencedRelation: "clubs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "products_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "product_categories";
            referencedColumns: ["id"];
          },
        ];
      };
      product_transactions: {
        Row: {
          id: string;
          club_id: string;
          product_id: string;
          member_id: string;
          fulfilled_by: string | null;
          quantity: number;
          unit_price_at_sale: number;
          total_price: number;
          weight_source: "manual" | "scale";
          scale_raw_reading: string | null;
          voided_at: string | null;
          voided_by: string | null;
          void_reason: string | null;
          sale_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          club_id: string;
          product_id: string;
          member_id: string;
          fulfilled_by?: string | null;
          quantity: number;
          unit_price_at_sale: number;
          total_price: number;
          weight_source?: "manual" | "scale";
          scale_raw_reading?: string | null;
          voided_at?: string | null;
          voided_by?: string | null;
          void_reason?: string | null;
          sale_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          club_id?: string;
          product_id?: string;
          member_id?: string;
          fulfilled_by?: string | null;
          quantity?: number;
          unit_price_at_sale?: number;
          total_price?: number;
          weight_source?: "manual" | "scale";
          scale_raw_reading?: string | null;
          voided_at?: string | null;
          voided_by?: string | null;
          void_reason?: string | null;
          sale_id?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "product_transactions_club_id_fkey";
            columns: ["club_id"];
            isOneToOne: false;
            referencedRelation: "clubs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "product_transactions_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "product_transactions_member_id_fkey";
            columns: ["member_id"];
            isOneToOne: false;
            referencedRelation: "members";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "product_transactions_sale_id_fkey";
            columns: ["sale_id"];
            isOneToOne: false;
            referencedRelation: "sales";
            referencedColumns: ["id"];
          },
        ];
      };
      sales: {
        Row: {
          id: string;
          club_id: string;
          member_id: string;
          fulfilled_by: string | null;
          subtotal: number;
          discount: number;
          total: number;
          paid_with: "saldo" | "cash";
          comment: string | null;
          voided_at: string | null;
          voided_by: string | null;
          void_reason: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          club_id: string;
          member_id: string;
          fulfilled_by?: string | null;
          subtotal: number;
          discount?: number;
          total: number;
          paid_with: "saldo" | "cash";
          comment?: string | null;
          voided_at?: string | null;
          voided_by?: string | null;
          void_reason?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          club_id?: string;
          member_id?: string;
          fulfilled_by?: string | null;
          subtotal?: number;
          discount?: number;
          total?: number;
          paid_with?: "saldo" | "cash";
          comment?: string | null;
          voided_at?: string | null;
          voided_by?: string | null;
          void_reason?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "sales_club_id_fkey";
            columns: ["club_id"];
            isOneToOne: false;
            referencedRelation: "clubs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sales_member_id_fkey";
            columns: ["member_id"];
            isOneToOne: false;
            referencedRelation: "members";
            referencedColumns: ["id"];
          },
        ];
      };
      member_saldo_transactions: {
        Row: {
          id: string;
          club_id: string;
          member_id: string;
          type: "topup" | "sale" | "refund" | "admin_adjustment";
          amount: number;
          balance_after: number;
          sale_id: string | null;
          method: string | null;
          comment: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          club_id: string;
          member_id: string;
          type: "topup" | "sale" | "refund" | "admin_adjustment";
          amount: number;
          balance_after: number;
          sale_id?: string | null;
          method?: string | null;
          comment?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          club_id?: string;
          member_id?: string;
          type?: "topup" | "sale" | "refund" | "admin_adjustment";
          amount?: number;
          balance_after?: number;
          sale_id?: string | null;
          method?: string | null;
          comment?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "member_saldo_transactions_club_id_fkey";
            columns: ["club_id"];
            isOneToOne: false;
            referencedRelation: "clubs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "member_saldo_transactions_member_id_fkey";
            columns: ["member_id"];
            isOneToOne: false;
            referencedRelation: "members";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "member_saldo_transactions_sale_id_fkey";
            columns: ["sale_id"];
            isOneToOne: false;
            referencedRelation: "sales";
            referencedColumns: ["id"];
          },
        ];
      };
      club_entries: {
        Row: {
          id: string;
          club_id: string;
          member_id: string;
          checked_in_at: string;
          checked_in_by: string | null;
          checked_out_at: string | null;
          checked_out_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          club_id: string;
          member_id: string;
          checked_in_at?: string;
          checked_in_by?: string | null;
          checked_out_at?: string | null;
          checked_out_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          club_id?: string;
          member_id?: string;
          checked_in_at?: string;
          checked_in_by?: string | null;
          checked_out_at?: string | null;
          checked_out_by?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "club_entries_club_id_fkey";
            columns: ["club_id"];
            isOneToOne: false;
            referencedRelation: "clubs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "club_entries_member_id_fkey";
            columns: ["member_id"];
            isOneToOne: false;
            referencedRelation: "members";
            referencedColumns: ["id"];
          },
        ];
      };
      email_campaigns: {
        Row: {
          id: string;
          club_id: string;
          subject: string;
          body_markdown: string;
          segment_filters: Record<string, unknown>;
          recipient_count: number;
          sent_at: string;
          sent_by: string | null;
        };
        Insert: {
          id?: string;
          club_id: string;
          subject: string;
          body_markdown: string;
          segment_filters?: Record<string, unknown>;
          recipient_count: number;
          sent_at?: string;
          sent_by?: string | null;
        };
        Update: {
          id?: string;
          club_id?: string;
          subject?: string;
          body_markdown?: string;
          segment_filters?: Record<string, unknown>;
          recipient_count?: number;
          sent_at?: string;
          sent_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "email_campaigns_club_id_fkey";
            columns: ["club_id"];
            isOneToOne: false;
            referencedRelation: "clubs";
            referencedColumns: ["id"];
          },
        ];
      };
      members: {
        Row: {
          id: string;
          club_id: string;
          member_code: string;
          pin_hash: string | null;
          full_name: string | null;
          first_name: string | null;
          last_name: string | null;
          email: string | null;
          email_opt_out: boolean;
          phone: string | null;
          id_number: string | null;
          residency_status: string | null;
          role_id: string | null;
          spin_balance: number;
          status: string;
          membership_period_id: string | null;
          valid_till: string | null;
          referred_by: string | null;
          is_premium_referrer: boolean;
          is_system_member: boolean;
          is_staff: boolean;
          referral_reward_spins: number;
          date_of_birth: string | null;
          id_verified_at: string | null;
          id_verified_by: string | null;
          id_photo_path: string | null;
          photo_path: string | null;
          signature_path: string | null;
          rfid_uid: string | null;
          can_do_entry: boolean;
          can_do_sell: boolean;
          can_do_topup: boolean;
          can_do_transactions: boolean;
          saldo_balance: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          club_id: string;
          member_code: string;
          pin_hash?: string | null;
          full_name?: string | null;
          first_name?: string | null;
          last_name?: string | null;
          email?: string | null;
          email_opt_out?: boolean;
          phone?: string | null;
          id_number?: string | null;
          residency_status?: string | null;
          role_id?: string | null;
          spin_balance?: number;
          status?: string;
          membership_period_id?: string | null;
          valid_till?: string | null;
          referred_by?: string | null;
          is_premium_referrer?: boolean;
          is_system_member?: boolean;
          is_staff?: boolean;
          referral_reward_spins?: number;
          date_of_birth?: string | null;
          id_verified_at?: string | null;
          id_verified_by?: string | null;
          id_photo_path?: string | null;
          photo_path?: string | null;
          signature_path?: string | null;
          rfid_uid?: string | null;
          can_do_entry?: boolean;
          can_do_sell?: boolean;
          can_do_topup?: boolean;
          can_do_transactions?: boolean;
          saldo_balance?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          club_id?: string;
          member_code?: string;
          pin_hash?: string | null;
          full_name?: string | null;
          first_name?: string | null;
          last_name?: string | null;
          email?: string | null;
          email_opt_out?: boolean;
          phone?: string | null;
          id_number?: string | null;
          residency_status?: string | null;
          role_id?: string | null;
          spin_balance?: number;
          status?: string;
          membership_period_id?: string | null;
          valid_till?: string | null;
          referred_by?: string | null;
          is_premium_referrer?: boolean;
          is_system_member?: boolean;
          is_staff?: boolean;
          referral_reward_spins?: number;
          date_of_birth?: string | null;
          id_verified_at?: string | null;
          id_verified_by?: string | null;
          id_photo_path?: string | null;
          photo_path?: string | null;
          signature_path?: string | null;
          rfid_uid?: string | null;
          can_do_entry?: boolean;
          can_do_sell?: boolean;
          can_do_topup?: boolean;
          can_do_transactions?: boolean;
          saldo_balance?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "members_club_id_fkey";
            columns: ["club_id"];
            isOneToOne: false;
            referencedRelation: "clubs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "members_role_id_fkey";
            columns: ["role_id"];
            isOneToOne: false;
            referencedRelation: "member_roles";
            referencedColumns: ["id"];
          },
        ];
      };
      member_roles: {
        Row: {
          id: string;
          club_id: string;
          name: string;
          display_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          club_id: string;
          name: string;
          display_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          club_id?: string;
          name?: string;
          display_order?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "member_roles_club_id_fkey";
            columns: ["club_id"];
            isOneToOne: false;
            referencedRelation: "clubs";
            referencedColumns: ["id"];
          },
        ];
      };
      membership_periods: {
        Row: {
          id: string;
          club_id: string;
          name: string;
          duration_months: number;
          display_order: number;
          active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          club_id: string;
          name: string;
          duration_months: number;
          display_order?: number;
          active?: boolean;
        };
        Update: {
          name?: string;
          duration_months?: number;
          display_order?: number;
          active?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "membership_periods_club_id_fkey";
            columns: ["club_id"];
            isOneToOne: false;
            referencedRelation: "clubs";
            referencedColumns: ["id"];
          },
        ];
      };
      spins: {
        Row: {
          id: string;
          club_id: string;
          member_id: string;
          outcome_label: string;
          outcome_value: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          club_id: string;
          member_id: string;
          outcome_label: string;
          outcome_value?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          club_id?: string;
          member_id?: string;
          outcome_label?: string;
          outcome_value?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "spins_club_id_fkey";
            columns: ["club_id"];
            isOneToOne: false;
            referencedRelation: "clubs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "spins_member_id_fkey";
            columns: ["member_id"];
            isOneToOne: false;
            referencedRelation: "members";
            referencedColumns: ["id"];
          },
        ];
      };
      invite_requests: {
        Row: {
          id: string;
          club_id: string;
          name: string;
          contact: string;
          message: string | null;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          club_id: string;
          name: string;
          contact: string;
          message?: string | null;
          status?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          club_id?: string;
          name?: string;
          contact?: string;
          message?: string | null;
          status?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "invite_requests_club_id_fkey";
            columns: ["club_id"];
            isOneToOne: false;
            referencedRelation: "clubs";
            referencedColumns: ["id"];
          },
        ];
      };
      preregistrations: {
        Row: {
          id: string;
          club_id: string;
          email: string;
          visit_date: string;
          num_visitors: number;
          age_confirmed: boolean;
          disclaimer_accepted: boolean;
          status: string;
          reviewed_by: string | null;
          reviewed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          club_id: string;
          email: string;
          visit_date: string;
          num_visitors?: number;
          age_confirmed?: boolean;
          disclaimer_accepted?: boolean;
          status?: string;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          club_id?: string;
          email?: string;
          visit_date?: string;
          num_visitors?: number;
          age_confirmed?: boolean;
          disclaimer_accepted?: boolean;
          status?: string;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "preregistrations_club_id_fkey";
            columns: ["club_id"];
            isOneToOne: false;
            referencedRelation: "clubs";
            referencedColumns: ["id"];
          },
        ];
      };
      club_gallery: {
        Row: {
          id: string;
          club_id: string;
          image_url: string;
          caption: string | null;
          display_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          club_id: string;
          image_url: string;
          caption?: string | null;
          display_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          club_id?: string;
          image_url?: string;
          caption?: string | null;
          display_order?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "club_gallery_club_id_fkey";
            columns: ["club_id"];
            isOneToOne: false;
            referencedRelation: "clubs";
            referencedColumns: ["id"];
          },
        ];
      };
      badges: {
        Row: {
          id: string;
          club_id: string;
          name: string;
          description: string | null;
          icon: string | null;
          image_url: string | null;
          color: string;
          active: boolean;
          display_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          club_id: string;
          name: string;
          description?: string | null;
          icon?: string | null;
          image_url?: string | null;
          color?: string;
          active?: boolean;
          display_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          club_id?: string;
          name?: string;
          description?: string | null;
          icon?: string | null;
          image_url?: string | null;
          color?: string;
          active?: boolean;
          display_order?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "badges_club_id_fkey";
            columns: ["club_id"];
            isOneToOne: false;
            referencedRelation: "clubs";
            referencedColumns: ["id"];
          },
        ];
      };
      member_badges: {
        Row: {
          id: string;
          member_id: string;
          badge_id: string;
          earned_at: string;
          quest_id: string | null;
        };
        Insert: {
          id?: string;
          member_id: string;
          badge_id: string;
          earned_at?: string;
          quest_id?: string | null;
        };
        Update: {
          id?: string;
          member_id?: string;
          badge_id?: string;
          earned_at?: string;
          quest_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "member_badges_member_id_fkey";
            columns: ["member_id"];
            isOneToOne: false;
            referencedRelation: "members";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "member_badges_badge_id_fkey";
            columns: ["badge_id"];
            isOneToOne: false;
            referencedRelation: "badges";
            referencedColumns: ["id"];
          },
        ];
      };
      wheel_configs: {
        Row: {
          id: string;
          club_id: string;
          label: string;
          reward_type: string;
          reward_value: number;
          probability: number;
          color: string | null;
          label_color: string | null;
          display_order: number;
          active: boolean;
        };
        Insert: {
          id?: string;
          club_id: string;
          label: string;
          reward_type: string;
          reward_value?: number;
          probability: number;
          color?: string | null;
          label_color?: string | null;
          display_order?: number;
          active?: boolean;
        };
        Update: {
          id?: string;
          club_id?: string;
          label?: string;
          reward_type?: string;
          reward_value?: number;
          probability?: number;
          color?: string | null;
          label_color?: string | null;
          display_order?: number;
          active?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "wheel_configs_club_id_fkey";
            columns: ["club_id"];
            isOneToOne: false;
            referencedRelation: "clubs";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
