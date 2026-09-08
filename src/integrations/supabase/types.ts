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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          created_at: string
          detail: Json | null
          entity: string
          entity_id: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          detail?: Json | null
          entity: string
          entity_id?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          detail?: Json | null
          entity?: string
          entity_id?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      defect_types: {
        Row: {
          category: string | null
          code: string
          created_at: string
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          category?: string | null
          code: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          category?: string | null
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: []
      }
      downtime_reasons: {
        Row: {
          category: string | null
          code: string
          created_at: string
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          category?: string | null
          code: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          category?: string | null
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: []
      }
      kpi_defects: {
        Row: {
          defect_type_id: string
          id: string
          note: string | null
          qty: number
          record_id: string
        }
        Insert: {
          defect_type_id: string
          id?: string
          note?: string | null
          qty?: number
          record_id: string
        }
        Update: {
          defect_type_id?: string
          id?: string
          note?: string | null
          qty?: number
          record_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "kpi_defects_defect_type_id_fkey"
            columns: ["defect_type_id"]
            isOneToOne: false
            referencedRelation: "defect_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kpi_defects_record_id_fkey"
            columns: ["record_id"]
            isOneToOne: false
            referencedRelation: "kpi_records"
            referencedColumns: ["id"]
          },
        ]
      }
      kpi_downtimes: {
        Row: {
          id: string
          minutes: number
          note: string | null
          reason_id: string
          record_id: string
        }
        Insert: {
          id?: string
          minutes?: number
          note?: string | null
          reason_id: string
          record_id: string
        }
        Update: {
          id?: string
          minutes?: number
          note?: string | null
          reason_id?: string
          record_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "kpi_downtimes_reason_id_fkey"
            columns: ["reason_id"]
            isOneToOne: false
            referencedRelation: "downtime_reasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kpi_downtimes_record_id_fkey"
            columns: ["record_id"]
            isOneToOne: false
            referencedRelation: "kpi_records"
            referencedColumns: ["id"]
          },
        ]
      }
      kpi_records: {
        Row: {
          achievement_rate: number | null
          actual_qty: number
          approved_at: string | null
          approved_by: string | null
          availability: number | null
          created_at: string
          created_by: string | null
          cycle_time_sec: number | null
          defect_qty: number
          defect_rate: number | null
          downtime_minutes: number
          good_qty: number
          id: string
          line_id: string
          machine_id: string | null
          manpower: number
          planned_minutes: number
          prod_date: string
          product_id: string | null
          quality_rate: number | null
          raw_material_qty: number | null
          reject_reason: string | null
          remark: string | null
          rework_qty: number
          scrap_qty: number
          shift_id: string
          status: Database["public"]["Enums"]["kpi_status"]
          submitted_at: string | null
          target_qty: number
          updated_at: string
          work_order: string | null
          yield_rate: number | null
        }
        Insert: {
          achievement_rate?: number | null
          actual_qty?: number
          approved_at?: string | null
          approved_by?: string | null
          availability?: number | null
          created_at?: string
          created_by?: string | null
          cycle_time_sec?: number | null
          defect_qty?: number
          defect_rate?: number | null
          downtime_minutes?: number
          good_qty?: number
          id?: string
          line_id: string
          machine_id?: string | null
          manpower?: number
          planned_minutes?: number
          prod_date: string
          product_id?: string | null
          quality_rate?: number | null
          raw_material_qty?: number | null
          reject_reason?: string | null
          remark?: string | null
          rework_qty?: number
          scrap_qty?: number
          shift_id: string
          status?: Database["public"]["Enums"]["kpi_status"]
          submitted_at?: string | null
          target_qty?: number
          updated_at?: string
          work_order?: string | null
          yield_rate?: number | null
        }
        Update: {
          achievement_rate?: number | null
          actual_qty?: number
          approved_at?: string | null
          approved_by?: string | null
          availability?: number | null
          created_at?: string
          created_by?: string | null
          cycle_time_sec?: number | null
          defect_qty?: number
          defect_rate?: number | null
          downtime_minutes?: number
          good_qty?: number
          id?: string
          line_id?: string
          machine_id?: string | null
          manpower?: number
          planned_minutes?: number
          prod_date?: string
          product_id?: string | null
          quality_rate?: number | null
          raw_material_qty?: number | null
          reject_reason?: string | null
          remark?: string | null
          rework_qty?: number
          scrap_qty?: number
          shift_id?: string
          status?: Database["public"]["Enums"]["kpi_status"]
          submitted_at?: string | null
          target_qty?: number
          updated_at?: string
          work_order?: string | null
          yield_rate?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "kpi_records_line_id_fkey"
            columns: ["line_id"]
            isOneToOne: false
            referencedRelation: "production_lines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kpi_records_machine_id_fkey"
            columns: ["machine_id"]
            isOneToOne: false
            referencedRelation: "machines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kpi_records_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kpi_records_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "shifts"
            referencedColumns: ["id"]
          },
        ]
      }
      machines: {
        Row: {
          code: string
          created_at: string
          id: string
          is_active: boolean
          line_id: string | null
          name: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          is_active?: boolean
          line_id?: string | null
          name: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          line_id?: string | null
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "machines_line_id_fkey"
            columns: ["line_id"]
            isOneToOne: false
            referencedRelation: "production_lines"
            referencedColumns: ["id"]
          },
        ]
      }
      production_lines: {
        Row: {
          code: string
          created_at: string
          department: string | null
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          code: string
          created_at?: string
          department?: string | null
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          code?: string
          created_at?: string
          department?: string | null
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          code: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          standard_cycle_time_sec: number | null
          unit: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          standard_cycle_time_sec?: number | null
          unit?: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          standard_cycle_time_sec?: number | null
          unit?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          department: string | null
          email: string | null
          employee_code: string | null
          full_name: string
          id: string
          is_active: boolean
        }
        Insert: {
          created_at?: string
          department?: string | null
          email?: string | null
          employee_code?: string | null
          full_name?: string
          id: string
          is_active?: boolean
        }
        Update: {
          created_at?: string
          department?: string | null
          email?: string | null
          employee_code?: string | null
          full_name?: string
          id?: string
          is_active?: boolean
        }
        Relationships: []
      }
      shifts: {
        Row: {
          code: string
          created_at: string
          end_time: string | null
          id: string
          is_active: boolean
          name: string
          planned_minutes: number
          start_time: string | null
        }
        Insert: {
          code: string
          created_at?: string
          end_time?: string | null
          id?: string
          is_active?: boolean
          name: string
          planned_minutes?: number
          start_time?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          end_time?: string | null
          id?: string
          is_active?: boolean
          name?: string
          planned_minutes?: number
          start_time?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_any_role: {
        Args: {
          _roles: Database["public"]["Enums"]["app_role"][]
          _user_id: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "operator"
        | "line_leader"
        | "supervisor"
        | "manager"
        | "qa"
        | "maintenance"
        | "admin"
        | "management"
      kpi_status: "draft" | "pending" | "approved" | "rejected"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: [
        "operator",
        "line_leader",
        "supervisor",
        "manager",
        "qa",
        "maintenance",
        "admin",
        "management",
      ],
      kpi_status: ["draft", "pending", "approved", "rejected"],
    },
  },
} as const
