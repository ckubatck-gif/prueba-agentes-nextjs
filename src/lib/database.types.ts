// Generado con la herramienta MCP de Supabase `generate_typescript_types` a partir de
// supabase/migrations/0001_init.sql. Se han quitado los genéricos auxiliares que no se usan.
// Si cambia el esquema, vuelve a generarlo.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.18";
  };
  public: {
    Tables: {
      appointments: {
        Row: {
          appointment_date: string;
          appointment_time: string;
          code: string;
          created_at: string;
          customer_name: string;
          email: string | null;
          id: string;
          notes: string | null;
          phone: string;
          plate: string;
          service_id: number;
          status: Database["public"]["Enums"]["appointment_status"];
          updated_at: string;
        };
        Insert: {
          appointment_date: string;
          appointment_time: string;
          code: string;
          created_at?: string;
          customer_name: string;
          email?: string | null;
          id?: string;
          notes?: string | null;
          phone: string;
          plate: string;
          service_id: number;
          status?: Database["public"]["Enums"]["appointment_status"];
          updated_at?: string;
        };
        Update: {
          appointment_date?: string;
          appointment_time?: string;
          code?: string;
          created_at?: string;
          customer_name?: string;
          email?: string | null;
          id?: string;
          notes?: string | null;
          phone?: string;
          plate?: string;
          service_id?: number;
          status?: Database["public"]["Enums"]["appointment_status"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "appointments_service_id_fkey";
            columns: ["service_id"];
            isOneToOne: false;
            referencedRelation: "services";
            referencedColumns: ["id"];
          },
        ];
      };
      services: {
        Row: {
          active: boolean;
          duration_minutes: number;
          id: number;
          name: string;
          price_from: number;
          slug: string;
          sort_order: number;
        };
        Insert: {
          active?: boolean;
          duration_minutes: number;
          id?: never;
          name: string;
          price_from: number;
          slug: string;
          sort_order?: number;
        };
        Update: {
          active?: boolean;
          duration_minutes?: number;
          id?: never;
          name?: string;
          price_from?: number;
          slug?: string;
          sort_order?: number;
        };
        Relationships: [];
      };
      staff: {
        Row: {
          created_at: string;
          display_name: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          display_name: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          display_name?: string;
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      book_appointment: {
        Args: {
          p_date: string;
          p_email?: string;
          p_name: string;
          p_notes?: string;
          p_phone: string;
          p_plate?: string;
          p_service_slug: string;
          p_time: string;
        };
        Returns: string;
      };
      get_booking: {
        Args: { p_code: string };
        Returns: {
          appointment_date: string;
          appointment_time: string;
          code: string;
          service_name: string;
          status: Database["public"]["Enums"]["appointment_status"];
        }[];
      };
      is_staff: { Args: never; Returns: boolean };
      taken_slots: {
        Args: { p_date: string };
        Returns: {
          slot: string;
        }[];
      };
    };
    Enums: {
      appointment_status: "pendiente" | "confirmada" | "completada" | "cancelada";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
