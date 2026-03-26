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
      members: {
        Row: {
          id: string;
          club_id: string;
          member_code: string;
          pin_hash: string;
          full_name: string | null;
          role_id: string | null;
          spin_balance: number;
          status: string;
          membership_period_id: string | null;
          valid_till: string | null;
          referred_by: string | null;
          is_premium_referrer: boolean;
          is_system_member: boolean;
          referral_reward_spins: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          club_id: string;
          member_code: string;
          pin_hash: string;
          full_name?: string | null;
          role_id?: string | null;
          spin_balance?: number;
          status?: string;
          membership_period_id?: string | null;
          valid_till?: string | null;
          referred_by?: string | null;
          is_premium_referrer?: boolean;
          is_system_member?: boolean;
          referral_reward_spins?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          club_id?: string;
          member_code?: string;
          pin_hash?: string;
          full_name?: string | null;
          role_id?: string | null;
          spin_balance?: number;
          status?: string;
          membership_period_id?: string | null;
          valid_till?: string | null;
          referred_by?: string | null;
          is_premium_referrer?: boolean;
          is_system_member?: boolean;
          referral_reward_spins?: number;
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
