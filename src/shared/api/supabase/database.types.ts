export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      account_members: {
        Row: {
          created_at: string;
          id: string;
          is_active: boolean;
          name: string;
          owner_id: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          is_active?: boolean;
          name: string;
          owner_id: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          is_active?: boolean;
          name?: string;
          owner_id?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          comment_id: string | null;
          created_at: string;
          event_type: string;
          id: number;
          owner_id: string;
          read_at: string | null;
          recipient_member_id: string;
          record_id: string | null;
          record_title: string;
          sender_member_id: string;
          sender_name: string;
        };
        Insert: {
          comment_id?: string | null;
          created_at?: string;
          event_type?: string;
          id?: never;
          owner_id: string;
          read_at?: string | null;
          recipient_member_id: string;
          record_id?: string | null;
          record_title: string;
          sender_member_id: string;
          sender_name: string;
        };
        Update: {
          comment_id?: string | null;
          created_at?: string;
          event_type?: string;
          id?: never;
          owner_id?: string;
          read_at?: string | null;
          recipient_member_id?: string;
          record_id?: string | null;
          record_title?: string;
          sender_member_id?: string;
          sender_name?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notifications_comment_id_fkey";
            columns: ["comment_id"];
            isOneToOne: false;
            referencedRelation: "record_comments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notifications_owner_recipient_member_fkey";
            columns: ["owner_id", "recipient_member_id"];
            isOneToOne: false;
            referencedRelation: "account_members";
            referencedColumns: ["owner_id", "id"];
          },
          {
            foreignKeyName: "notifications_owner_sender_member_fkey";
            columns: ["owner_id", "sender_member_id"];
            isOneToOne: false;
            referencedRelation: "account_members";
            referencedColumns: ["owner_id", "id"];
          },
          {
            foreignKeyName: "notifications_record_id_fkey";
            columns: ["record_id"];
            isOneToOne: false;
            referencedRelation: "records";
            referencedColumns: ["id"];
          },
        ];
      };
      places: {
        Row: {
          address: string | null;
          created_at: string;
          id: string;
          latitude: number;
          longitude: number;
          name: string;
          owner_id: string;
          provider: string;
          provider_place_id: string;
          region_code: string;
          region_name: string | null;
          saved_at: string | null;
          updated_at: string;
        };
        Insert: {
          address?: string | null;
          created_at?: string;
          id?: string;
          latitude: number;
          longitude: number;
          name: string;
          owner_id: string;
          provider: string;
          provider_place_id: string;
          region_code: string;
          region_name?: string | null;
          saved_at?: string | null;
          updated_at?: string;
        };
        Update: {
          address?: string | null;
          created_at?: string;
          id?: string;
          latitude?: number;
          longitude?: number;
          name?: string;
          owner_id?: string;
          provider?: string;
          provider_place_id?: string;
          region_code?: string;
          region_name?: string | null;
          saved_at?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          created_at: string;
          display_name: string | null;
          id: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          display_name?: string | null;
          id: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          display_name?: string | null;
          id?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      push_subscriptions: {
        Row: {
          auth_key: string;
          created_at: string;
          endpoint: string;
          id: string;
          member_id: string | null;
          owner_id: string;
          p256dh: string;
          updated_at: string;
        };
        Insert: {
          auth_key: string;
          created_at?: string;
          endpoint: string;
          id?: string;
          member_id?: string | null;
          owner_id: string;
          p256dh: string;
          updated_at?: string;
        };
        Update: {
          auth_key?: string;
          created_at?: string;
          endpoint?: string;
          id?: string;
          member_id?: string | null;
          owner_id?: string;
          p256dh?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_owner_member_fkey";
            columns: ["owner_id", "member_id"];
            isOneToOne: false;
            referencedRelation: "account_members";
            referencedColumns: ["owner_id", "id"];
          },
        ];
      };
      record_comments: {
        Row: {
          author_member_id: string;
          body: string;
          created_at: string;
          id: string;
          owner_id: string;
          record_id: string;
          updated_at: string;
        };
        Insert: {
          author_member_id: string;
          body: string;
          created_at?: string;
          id: string;
          owner_id: string;
          record_id: string;
          updated_at?: string;
        };
        Update: {
          author_member_id?: string;
          body?: string;
          created_at?: string;
          id?: string;
          owner_id?: string;
          record_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "record_comments_owner_author_member_fkey";
            columns: ["owner_id", "author_member_id"];
            isOneToOne: false;
            referencedRelation: "account_members";
            referencedColumns: ["owner_id", "id"];
          },
          {
            foreignKeyName: "record_comments_owner_record_fkey";
            columns: ["owner_id", "record_id"];
            isOneToOne: false;
            referencedRelation: "records";
            referencedColumns: ["owner_id", "id"];
          },
        ];
      };
      record_places: {
        Row: {
          created_at: string;
          place_id: string;
          record_id: string;
        };
        Insert: {
          created_at?: string;
          place_id: string;
          record_id: string;
        };
        Update: {
          created_at?: string;
          place_id?: string;
          record_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "record_places_place_id_fkey";
            columns: ["place_id"];
            isOneToOne: false;
            referencedRelation: "places";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "record_places_record_id_fkey";
            columns: ["record_id"];
            isOneToOne: false;
            referencedRelation: "records";
            referencedColumns: ["id"];
          },
        ];
      };
      records: {
        Row: {
          activity: string;
          author_member_id: string | null;
          created_at: string;
          id: string;
          memo: string | null;
          owner_id: string;
          recorded_at: string;
          recorded_until: string | null;
          region_code: string;
          region_label: string;
          region_latitude: number;
          region_longitude: number;
          region_name: string;
          updated_at: string;
          weather: string;
        };
        Insert: {
          activity: string;
          author_member_id?: string | null;
          created_at?: string;
          id?: string;
          memo?: string | null;
          owner_id: string;
          recorded_at: string;
          recorded_until?: string | null;
          region_code: string;
          region_label: string;
          region_latitude: number;
          region_longitude: number;
          region_name: string;
          updated_at?: string;
          weather?: string;
        };
        Update: {
          activity?: string;
          author_member_id?: string | null;
          created_at?: string;
          id?: string;
          memo?: string | null;
          owner_id?: string;
          recorded_at?: string;
          recorded_until?: string | null;
          region_code?: string;
          region_label?: string;
          region_latitude?: number;
          region_longitude?: number;
          region_name?: string;
          updated_at?: string;
          weather?: string;
        };
        Relationships: [
          {
            foreignKeyName: "records_owner_author_member_fkey";
            columns: ["owner_id", "author_member_id"];
            isOneToOne: false;
            referencedRelation: "account_members";
            referencedColumns: ["owner_id", "id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      create_record_comment: {
        Args: {
          p_author_member_id: string;
          p_body: string;
          p_comment_id: string;
          p_record_id: string;
        };
        Returns: {
          author_member_id: string;
          author_name: string;
          body: string;
          created: boolean;
          created_at: string;
          id: string;
          record_id: string;
          updated_at: string;
        }[];
      };
      create_owned_record_with_places: {
        Args: {
          p_activity: string;
          p_author_member_id: string;
          p_memo: string;
          p_places: Json;
          p_recorded_at: string;
          p_recorded_until: string | null;
          p_region_code: string;
          p_region_label: string;
          p_region_latitude: number;
          p_region_longitude: number;
          p_region_name: string;
          p_weather: string;
        };
        Returns: string;
      };
      create_owned_record:
        | {
            Args: {
              p_activity: string;
              p_memo: string;
              p_place_ids: string[];
              p_recorded_at: string;
              p_recorded_until: string | null;
              p_region_code: string;
              p_region_label: string;
              p_region_latitude: number;
              p_region_longitude: number;
              p_region_name: string;
              p_weather: string;
            };
            Returns: string;
          }
        | {
            Args: {
              p_activity: string;
              p_author_member_id: string;
              p_memo: string;
              p_place_ids: string[];
              p_recorded_at: string;
              p_recorded_until: string | null;
              p_region_code: string;
              p_region_label: string;
              p_region_latitude: number;
              p_region_longitude: number;
              p_region_name: string;
              p_weather: string;
            };
            Returns: string;
          };
      delete_owned_record: { Args: { p_record_id: string }; Returns: boolean };
      mark_all_notifications_read: {
        Args: { p_recipient_member_id: string };
        Returns: number;
      };
      mark_notification_read: {
        Args: { p_notification_id: number; p_recipient_member_id: string };
        Returns: boolean;
      };
      remove_saved_place: { Args: { p_place_id: string }; Returns: boolean };
      save_owned_places: { Args: { p_places: Json }; Returns: boolean };
      setup_account_members: { Args: { p_names: string[] }; Returns: boolean };
      update_owned_record: {
        Args: {
          p_activity: string;
          p_memo: string;
          p_place_ids: string[];
          p_record_id: string;
          p_recorded_at: string;
          p_recorded_until: string | null;
          p_region_code: string;
          p_region_label: string;
          p_region_latitude: number;
          p_region_longitude: number;
          p_region_name: string;
          p_weather: string;
        };
        Returns: boolean;
      };
      update_owned_record_with_places: {
        Args: {
          p_activity: string;
          p_memo: string;
          p_places: Json;
          p_record_id: string;
          p_recorded_at: string;
          p_recorded_until: string | null;
          p_region_code: string;
          p_region_label: string;
          p_region_latitude: number;
          p_region_longitude: number;
          p_region_name: string;
          p_weather: string;
        };
        Returns: boolean;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
