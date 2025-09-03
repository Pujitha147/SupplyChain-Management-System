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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      batches: {
        Row: {
          batch_number: string
          created_at: string
          current_owner_id: string | null
          current_quantity: number
          expiry_date: string
          id: string
          manufacture_date: string
          manufacturer_id: string
          medicine_id: string
          qr_code: string
          quantity: number
          status: Database["public"]["Enums"]["medicine_status"]
          updated_at: string
        }
        Insert: {
          batch_number: string
          created_at?: string
          current_owner_id?: string | null
          current_quantity: number
          expiry_date: string
          id?: string
          manufacture_date: string
          manufacturer_id: string
          medicine_id: string
          qr_code: string
          quantity: number
          status?: Database["public"]["Enums"]["medicine_status"]
          updated_at?: string
        }
        Update: {
          batch_number?: string
          created_at?: string
          current_owner_id?: string | null
          current_quantity?: number
          expiry_date?: string
          id?: string
          manufacture_date?: string
          manufacturer_id?: string
          medicine_id?: string
          qr_code?: string
          quantity?: number
          status?: Database["public"]["Enums"]["medicine_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "batches_current_owner_id_fkey"
            columns: ["current_owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "batches_manufacturer_id_fkey"
            columns: ["manufacturer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "batches_medicine_id_fkey"
            columns: ["medicine_id"]
            isOneToOne: false
            referencedRelation: "medicines"
            referencedColumns: ["id"]
          },
        ]
      }
      counterfeit_reports: {
        Row: {
          admin_notes: string | null
          batch_id: string | null
          created_at: string
          description: string
          id: string
          location: string | null
          qr_code: string
          report_type: string
          reporter_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          batch_id?: string | null
          created_at?: string
          description: string
          id?: string
          location?: string | null
          qr_code: string
          report_type: string
          reporter_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          batch_id?: string | null
          created_at?: string
          description?: string
          id?: string
          location?: string | null
          qr_code?: string
          report_type?: string
          reporter_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "counterfeit_reports_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "counterfeit_reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      medicines: {
        Row: {
          composition: string | null
          created_at: string
          description: string | null
          dosage: string | null
          drug_code: string
          expiry_months: number
          id: string
          manufacturer_id: string
          name: string
          side_effects: string | null
          updated_at: string
        }
        Insert: {
          composition?: string | null
          created_at?: string
          description?: string | null
          dosage?: string | null
          drug_code: string
          expiry_months?: number
          id?: string
          manufacturer_id: string
          name: string
          side_effects?: string | null
          updated_at?: string
        }
        Update: {
          composition?: string | null
          created_at?: string
          description?: string | null
          dosage?: string | null
          drug_code?: string
          expiry_months?: number
          id?: string
          manufacturer_id?: string
          name?: string
          side_effects?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "medicines_manufacturer_id_fkey"
            columns: ["manufacturer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          company_name: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          license_number: string | null
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          address?: string | null
          company_name?: string | null
          created_at?: string
          email: string
          full_name: string
          id: string
          license_number?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          address?: string | null
          company_name?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          license_number?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      supply_chain_transactions: {
        Row: {
          batch_id: string
          created_at: string
          from_user_id: string | null
          id: string
          notes: string | null
          quantity: number
          to_user_id: string
          transaction_date: string
          transaction_type: string
        }
        Insert: {
          batch_id: string
          created_at?: string
          from_user_id?: string | null
          id?: string
          notes?: string | null
          quantity: number
          to_user_id: string
          transaction_date?: string
          transaction_type: string
        }
        Update: {
          batch_id?: string
          created_at?: string
          from_user_id?: string | null
          id?: string
          notes?: string | null
          quantity?: number
          to_user_id?: string
          transaction_date?: string
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "supply_chain_transactions_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supply_chain_transactions_from_user_id_fkey"
            columns: ["from_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supply_chain_transactions_to_user_id_fkey"
            columns: ["to_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      verification_logs: {
        Row: {
          batch_id: string | null
          created_at: string
          id: string
          location: string | null
          qr_code: string
          verification_result: string
          verifier_id: string | null
        }
        Insert: {
          batch_id?: string | null
          created_at?: string
          id?: string
          location?: string | null
          qr_code: string
          verification_result: string
          verifier_id?: string | null
        }
        Update: {
          batch_id?: string | null
          created_at?: string
          id?: string
          location?: string | null
          qr_code?: string
          verification_result?: string
          verifier_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "verification_logs_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "verification_logs_verifier_id_fkey"
            columns: ["verifier_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: { user_id: string }
        Returns: Database["public"]["Enums"]["user_role"]
      }
    }
    Enums: {
      medicine_status:
        | "manufactured"
        | "distributed"
        | "delivered"
        | "sold"
        | "expired"
        | "recalled"
      user_role:
        | "admin"
        | "manufacturer"
        | "distributor"
        | "retailer"
        | "customer"
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
  public: {
    Enums: {
      medicine_status: [
        "manufactured",
        "distributed",
        "delivered",
        "sold",
        "expired",
        "recalled",
      ],
      user_role: [
        "admin",
        "manufacturer",
        "distributor",
        "retailer",
        "customer",
      ],
    },
  },
} as const
