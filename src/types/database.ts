// src/types/database.ts
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  __InternalSupabase: { PostgrestVersion: "14.15" };
  public: {
    Tables: {
      categories: {
        Row: {
          id: string;
          name: string;
          sort_order: number | null;
          store_id: string;
        };
        Insert: {
          id?: string;
          name: string;
          sort_order?: number | null;
          store_id: string;
        };
        Update: {
          id?: string;
          name?: string;
          sort_order?: number | null;
          store_id?: string;
        };
      };
      coffee_option_categories: {
        Row: { category_id: string; option_id: string };
        Insert: { category_id: string; option_id: string };
        Update: { category_id?: string; option_id?: string };
      };
      coffee_options: {
        Row: {
          id: string;
          label: string;
          price_delta: number | null;
          store_id: string;
          type: string;
        };
        Insert: {
          id?: string;
          label: string;
          price_delta?: number | null;
          store_id: string;
          type: string;
        };
        Update: {
          id?: string;
          label?: string;
          price_delta?: number | null;
          store_id?: string;
          type?: string;
        };
      };
      coffees: {
        Row: {
          base_price: number;
          category_id: string | null;
          description: string | null;
          id: string;
          image_url: string | null;
          is_active: boolean | null;
          is_featured: boolean | null;
          name: string;
          rating: number | null;
          store_id: string;
        };
        Insert: {
          base_price: number;
          category_id?: string | null;
          description?: string | null;
          id?: string;
          image_url?: string | null;
          is_active?: boolean | null;
          is_featured?: boolean | null;
          name: string;
          rating?: number | null;
          store_id: string;
        };
        Update: {
          base_price?: number;
          category_id?: string | null;
          description?: string | null;
          id?: string;
          image_url?: string | null;
          is_active?: boolean | null;
          is_featured?: boolean | null;
          name?: string;
          rating?: number | null;
          store_id?: string;
        };
      };
      favorites: {
        Row: { coffee_id: string; created_at: string | null; user_id: string };
        Insert: {
          coffee_id: string;
          created_at?: string | null;
          user_id: string;
        };
        Update: {
          coffee_id?: string;
          created_at?: string | null;
          user_id?: string;
        };
      };
      order_items: {
        Row: {
          coffee_id: string | null;
          compare_at_price: number | null;
          created_at: string;
          extras: string[] | null;
          id: string;
          milk: string | null;
          order_id: string | null;
          quantity: number;
          size: string | null;
          temperature: string | null;
          unit_price: number;
        };
        Insert: {
          coffee_id?: string | null;
          compare_at_price?: number | null;
          created_at?: string;
          extras?: string[] | null;
          id?: string;
          milk?: string | null;
          order_id?: string | null;
          quantity?: number;
          size?: string | null;
          temperature?: string | null;
          unit_price: number;
        };
        Update: {
          coffee_id?: string | null;
          compare_at_price?: number | null;
          created_at?: string;
          extras?: string[] | null;
          id?: string;
          milk?: string | null;
          order_id?: string | null;
          quantity?: number;
          size?: string | null;
          temperature?: string | null;
          unit_price?: number;
        };
      };
      orders: {
        Row: {
          completed_at: string | null;
          fulfillment: string;
          id: string;
          placed_at: string | null;
          ready_at: string | null;
          status: string;
          store_id: string;
          subtotal: number;
          tax: number;
          total: number;
          delivery_fee: number;
          delivery_address: string | null;
          user_id: string;
        };
        Insert: {
          completed_at?: string | null;
          fulfillment?: string;
          id?: string;
          placed_at?: string | null;
          ready_at?: string | null;
          status?: string;
          store_id: string;
          subtotal: number;
          tax: number;
          total: number;
          delivery_fee?: number;
          delivery_address?: string | null;
          user_id: string;
        };
        Update: {
          completed_at?: string | null;
          fulfillment?: string;
          id?: string;
          placed_at?: string | null;
          ready_at?: string | null;
          status?: string;
          store_id?: string;
          subtotal?: number;
          tax?: number;
          total?: number;
          delivery_fee?: number;
          delivery_address?: string | null;
          user_id?: string;
        };
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string | null;
          full_name: string | null;
          id: string;
          role: string;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string | null;
          full_name?: string | null;
          id: string;
          role?: string;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string | null;
          full_name?: string | null;
          id?: string;
          role?: string;
        };
      };
      promotions: {
        Row: {
          category_id: string | null;
          coffee_id: string | null;
          created_at: string;
          description: string;
          discount_percent: number;
          ends_at: string;
          id: number;
          is_active: boolean;
          scope: string;
          starts_at: string;
          store_id: string;
          target_key: string | null;
          title: string;
          code: string | null;
        };
        Insert: {
          category_id?: string | null;
          coffee_id?: string | null;
          created_at?: string;
          description: string;
          discount_percent: number;
          ends_at: string;
          id?: number;
          is_active?: boolean;
          scope?: string;
          starts_at: string;
          store_id: string;
          target_key?: string | null;
          title: string;
          code?: string | null;
        };
        Update: {
          category_id?: string | null;
          coffee_id?: string | null;
          created_at?: string;
          description?: string;
          discount_percent?: number;
          ends_at?: string;
          id?: number;
          is_active?: boolean;
          scope?: string;
          starts_at?: string;
          store_id?: string;
          target_key?: string | null;
          title?: string;
          code?: string | null;
        };
      };
      stores: {
        Row: {
          address: string;
          hours: Json | null;
          id: string;
          lat: number | null;
          lng: number | null;
          name: string;
          owner_id: string;
        };
        Insert: {
          address: string;
          hours?: Json | null;
          id?: string;
          lat?: number | null;
          lng?: number | null;
          name: string;
          owner_id: string;
        };
        Update: {
          address?: string;
          hours?: Json | null;
          id?: string;
          lat?: number | null;
          lng?: number | null;
          name?: string;
          owner_id?: string;
        };
      };
      store_favorites: {
        Row: {
          user_id: string;
          store_id: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          store_id: string;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          store_id?: string;
          created_at?: string;
        };
      };
      addresses: {
        Row: {
          id: string;
          user_id: string;
          label: string;
          full_name: string;
          phone: string;
          address: string;
          lat: number | null;
          lng: number | null;
          is_default: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          label?: string;
          full_name?: string;
          phone?: string;
          address: string;
          lat?: number | null;
          lng?: number | null;
          is_default?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          label?: string;
          full_name?: string;
          phone?: string;
          address?: string;
          lat?: number | null;
          lng?: number | null;
          is_default?: boolean;
          created_at?: string;
        };
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      become_seller: {
        Args: { p_hours?: Json; p_store_address: string; p_store_name: string };
        Returns: string;
      };
      create_order: {
        Args: {
          p_fulfillment: string;
          p_items: Json;
          p_store_id: string;
          p_subtotal: number;
          p_tax: number;
          p_total: number;
        };
        Returns: string;
      };
      get_coffee_options: {
        Args: { p_category_id: string };
        Returns: {
          id: string;
          label: string;
          price_delta: number | null;
          store_id: string;
          type: string;
        }[];
      };
      is_store_owner: { Args: { p_store_id: string }; Returns: boolean };
      set_option_category_scoping: {
        Args: { p_category_ids: string[]; p_option_id: string };
        Returns: undefined;
      };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;
type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

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
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
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
