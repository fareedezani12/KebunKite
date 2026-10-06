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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      communities: {
        Row: {
          admin_id: string | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          location: string | null
          name: string
        }
        Insert: {
          admin_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          location?: string | null
          name: string
        }
        Update: {
          admin_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          location?: string | null
          name?: string
        }
        Relationships: []
      }
      community_members: {
        Row: {
          community_id: string
          id: string
          joined_at: string
          role: string
          user_id: string
        }
        Insert: {
          community_id: string
          id?: string
          joined_at?: string
          role?: string
          user_id: string
        }
        Update: {
          community_id?: string
          id?: string
          joined_at?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_members_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      community_messages: {
        Row: {
          community_id: string
          created_at: string
          id: string
          message: string
          user_id: string
        }
        Insert: {
          community_id: string
          created_at?: string
          id?: string
          message: string
          user_id: string
        }
        Update: {
          community_id?: string
          created_at?: string
          id?: string
          message?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_messages_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      crop_plans: {
        Row: {
          community_id: string | null
          community_skill_level: string | null
          created_at: string
          created_by: string
          farming_technique: string | null
          id: string
          status: string
        }
        Insert: {
          community_id?: string | null
          community_skill_level?: string | null
          created_at?: string
          created_by: string
          farming_technique?: string | null
          id?: string
          status?: string
        }
        Update: {
          community_id?: string | null
          community_skill_level?: string | null
          created_at?: string
          created_by?: string
          farming_technique?: string | null
          id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "crop_plans_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      crop_recommendations: {
        Row: {
          created_at: string
          crop_id: string | null
          crop_plan_id: string | null
          estimated_harvest_days: number | null
          household_id: string
          id: string
          reason: string | null
          recommended_quantity: number | null
          status: string
          suitability: string | null
        }
        Insert: {
          created_at?: string
          crop_id?: string | null
          crop_plan_id?: string | null
          estimated_harvest_days?: number | null
          household_id: string
          id?: string
          reason?: string | null
          recommended_quantity?: number | null
          status?: string
          suitability?: string | null
        }
        Update: {
          created_at?: string
          crop_id?: string | null
          crop_plan_id?: string | null
          estimated_harvest_days?: number | null
          household_id?: string
          id?: string
          reason?: string | null
          recommended_quantity?: number | null
          status?: string
          suitability?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crop_recommendations_crop_id_fkey"
            columns: ["crop_id"]
            isOneToOne: false
            referencedRelation: "crops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crop_recommendations_crop_plan_id_fkey"
            columns: ["crop_plan_id"]
            isOneToOne: false
            referencedRelation: "crop_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      crops: {
        Row: {
          category: string | null
          created_at: string
          crop_name: string
          estimated_harvest_max_days: number | null
          estimated_harvest_min_days: number | null
          id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          crop_name: string
          estimated_harvest_max_days?: number | null
          estimated_harvest_min_days?: number | null
          id?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          crop_name?: string
          estimated_harvest_max_days?: number | null
          estimated_harvest_min_days?: number | null
          id?: string
        }
        Relationships: []
      }
      harvest_outputs: {
        Row: {
          community_id: string | null
          created_at: string
          crop_id: string | null
          harvest_date: string
          household_id: string
          id: string
          quantity_kg: number
          shared_at: string | null
          surplus_kg: number
        }
        Insert: {
          community_id?: string | null
          created_at?: string
          crop_id?: string | null
          harvest_date?: string
          household_id: string
          id?: string
          quantity_kg?: number
          shared_at?: string | null
          surplus_kg?: number
        }
        Update: {
          community_id?: string | null
          created_at?: string
          crop_id?: string | null
          harvest_date?: string
          household_id?: string
          id?: string
          quantity_kg?: number
          shared_at?: string | null
          surplus_kg?: number
        }
        Relationships: [
          {
            foreignKeyName: "harvest_outputs_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "harvest_outputs_crop_id_fkey"
            columns: ["crop_id"]
            isOneToOne: false
            referencedRelation: "crops"
            referencedColumns: ["id"]
          },
        ]
      }
      household_needs: {
        Row: {
          created_at: string
          crop_name: string
          id: string
          quantity_needed: number
          user_id: string
        }
        Insert: {
          created_at?: string
          crop_name: string
          id?: string
          quantity_needed?: number
          user_id: string
        }
        Update: {
          created_at?: string
          crop_name?: string
          id?: string
          quantity_needed?: number
          user_id?: string
        }
        Relationships: []
      }
      planting_schedule: {
        Row: {
          activity: string | null
          created_at: string
          crop_id: string | null
          expected_harvest_date: string | null
          household_id: string
          id: string
          planting_date: string | null
          quantity: number | null
          recommendation_id: string | null
          status: string
        }
        Insert: {
          activity?: string | null
          created_at?: string
          crop_id?: string | null
          expected_harvest_date?: string | null
          household_id: string
          id?: string
          planting_date?: string | null
          quantity?: number | null
          recommendation_id?: string | null
          status?: string
        }
        Update: {
          activity?: string | null
          created_at?: string
          crop_id?: string | null
          expected_harvest_date?: string | null
          household_id?: string
          id?: string
          planting_date?: string | null
          quantity?: number | null
          recommendation_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "planting_schedule_crop_id_fkey"
            columns: ["crop_id"]
            isOneToOne: false
            referencedRelation: "crops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "planting_schedule_recommendation_id_fkey"
            columns: ["recommendation_id"]
            isOneToOne: false
            referencedRelation: "crop_recommendations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          farming_technique: string | null
          full_name: string | null
          growing_area: number | null
          household_members: number | null
          id: string
          location: string | null
          profile_photo: string | null
          skill_level: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          farming_technique?: string | null
          full_name?: string | null
          growing_area?: number | null
          household_members?: number | null
          id: string
          location?: string | null
          profile_photo?: string | null
          skill_level?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          farming_technique?: string | null
          full_name?: string | null
          growing_area?: number | null
          household_members?: number | null
          id?: string
          location?: string | null
          profile_photo?: string | null
          skill_level?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_public_profiles: {
        Args: { _ids: string[] }
        Returns: {
          full_name: string
          id: string
          profile_photo: string
        }[]
      }
      is_community_admin: {
        Args: { _community: string; _user: string }
        Returns: boolean
      }
      is_community_member: {
        Args: { _community: string; _user: string }
        Returns: boolean
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
    Enums: {},
  },
} as const
