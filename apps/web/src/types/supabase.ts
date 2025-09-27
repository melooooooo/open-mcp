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
      collections: {
        Row: {
          created_at: string | null
          id: string
          item_id: string | null
          item_type: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          item_id?: string | null
          item_type?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          item_id?: string | null
          item_type?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "collections_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          benefits: Json | null
          created_at: string | null
          created_by: string | null
          culture_score: number | null
          description: string | null
          funding_stage: string | null
          id: string
          industry: string | null
          locations: string[] | null
          logo_url: string | null
          name: string
          size: string | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          benefits?: Json | null
          created_at?: string | null
          created_by?: string | null
          culture_score?: number | null
          description?: string | null
          funding_stage?: string | null
          id?: string
          industry?: string | null
          locations?: string[] | null
          logo_url?: string | null
          name: string
          size?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          benefits?: Json | null
          created_at?: string | null
          created_by?: string | null
          culture_score?: number | null
          description?: string | null
          funding_stage?: string | null
          id?: string
          industry?: string | null
          locations?: string[] | null
          logo_url?: string | null
          name?: string
          size?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "companies_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      experiences: {
        Row: {
          author_id: string | null
          company_id: string | null
          content: string | null
          created_at: string | null
          difficulty: number | null
          helpful_count: number | null
          id: string
          job_title: string | null
          status: string | null
          tags: string[] | null
          title: string
          type: string | null
          updated_at: string | null
          view_count: number | null
        }
        Insert: {
          author_id?: string | null
          company_id?: string | null
          content?: string | null
          created_at?: string | null
          difficulty?: number | null
          helpful_count?: number | null
          id?: string
          job_title?: string | null
          status?: string | null
          tags?: string[] | null
          title: string
          type?: string | null
          updated_at?: string | null
          view_count?: number | null
        }
        Update: {
          author_id?: string | null
          company_id?: string | null
          content?: string | null
          created_at?: string | null
          difficulty?: number | null
          helpful_count?: number | null
          id?: string
          job_title?: string | null
          status?: string | null
          tags?: string[] | null
          title?: string
          type?: string | null
          updated_at?: string | null
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "experiences_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "experiences_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          application_count: number | null
          application_deadline: string | null
          benefits: string[] | null
          company_id: string | null
          created_at: string | null
          created_by: string | null
          department: string | null
          description: string | null
          education_requirement: string | null
          experience_requirement: string | null
          id: string
          job_type: string | null
          locations: string[] | null
          requirements: string[] | null
          salary_max: number | null
          salary_min: number | null
          status: string | null
          title: string
          updated_at: string | null
          view_count: number | null
        }
        Insert: {
          application_count?: number | null
          application_deadline?: string | null
          benefits?: string[] | null
          company_id?: string | null
          created_at?: string | null
          created_by?: string | null
          department?: string | null
          description?: string | null
          education_requirement?: string | null
          experience_requirement?: string | null
          id?: string
          job_type?: string | null
          locations?: string[] | null
          requirements?: string[] | null
          salary_max?: number | null
          salary_min?: number | null
          status?: string | null
          title: string
          updated_at?: string | null
          view_count?: number | null
        }
        Update: {
          application_count?: number | null
          application_deadline?: string | null
          benefits?: string[] | null
          company_id?: string | null
          created_at?: string | null
          created_by?: string | null
          department?: string | null
          description?: string | null
          education_requirement?: string | null
          experience_requirement?: string | null
          id?: string
          job_type?: string | null
          locations?: string[] | null
          requirements?: string[] | null
          salary_max?: number | null
          salary_min?: number | null
          status?: string | null
          title?: string
          updated_at?: string | null
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "jobs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          content: string | null
          created_at: string | null
          data: Json | null
          id: string
          is_read: boolean | null
          title: string | null
          type: string | null
          user_id: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          data?: Json | null
          id?: string
          is_read?: boolean | null
          title?: string | null
          type?: string | null
          user_id?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          data?: Json | null
          id?: string
          is_read?: boolean | null
          title?: string | null
          type?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          education_level: string | null
          expected_salary_max: number | null
          expected_salary_min: number | null
          full_name: string | null
          graduation_year: number | null
          id: string
          is_referrer: boolean | null
          is_verified: boolean | null
          major: string | null
          points: number | null
          target_locations: string[] | null
          university: string | null
          updated_at: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          education_level?: string | null
          expected_salary_max?: number | null
          expected_salary_min?: number | null
          full_name?: string | null
          graduation_year?: number | null
          id: string
          is_referrer?: boolean | null
          is_verified?: boolean | null
          major?: string | null
          points?: number | null
          target_locations?: string[] | null
          university?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          education_level?: string | null
          expected_salary_max?: number | null
          expected_salary_min?: number | null
          full_name?: string | null
          graduation_year?: number | null
          id?: string
          is_referrer?: boolean | null
          is_verified?: boolean | null
          major?: string | null
          points?: number | null
          target_locations?: string[] | null
          university?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
      referral_applications: {
        Row: {
          applicant_id: string | null
          created_at: string | null
          feedback: string | null
          id: string
          introduction: string | null
          referral_code: string | null
          referral_id: string | null
          resume_url: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          applicant_id?: string | null
          created_at?: string | null
          feedback?: string | null
          id?: string
          introduction?: string | null
          referral_code?: string | null
          referral_id?: string | null
          resume_url?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          applicant_id?: string | null
          created_at?: string | null
          feedback?: string | null
          id?: string
          introduction?: string | null
          referral_code?: string | null
          referral_id?: string | null
          resume_url?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "referral_applications_applicant_id_fkey"
            columns: ["applicant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_applications_referral_id_fkey"
            columns: ["referral_id"]
            isOneToOne: false
            referencedRelation: "referrals"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          company_id: string | null
          created_at: string | null
          description: string | null
          id: string
          job_id: string | null
          quota_total: number | null
          quota_used: number | null
          referrer_id: string | null
          requirements: string[] | null
          status: string | null
          success_rate: number | null
          title: string
          updated_at: string | null
          valid_until: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          job_id?: string | null
          quota_total?: number | null
          quota_used?: number | null
          referrer_id?: string | null
          requirements?: string[] | null
          status?: string | null
          success_rate?: number | null
          title: string
          updated_at?: string | null
          valid_until?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          job_id?: string | null
          quota_total?: number | null
          quota_used?: number | null
          referrer_id?: string | null
          requirements?: string[] | null
          status?: string | null
          success_rate?: number | null
          title?: string
          updated_at?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "referrals_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      resumes: {
        Row: {
          ai_score: number | null
          content: Json | null
          created_at: string | null
          file_url: string | null
          id: string
          is_public: boolean | null
          template: string | null
          title: string | null
          updated_at: string | null
          user_id: string | null
          view_count: number | null
        }
        Insert: {
          ai_score?: number | null
          content?: Json | null
          created_at?: string | null
          file_url?: string | null
          id?: string
          is_public?: boolean | null
          template?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
          view_count?: number | null
        }
        Update: {
          ai_score?: number | null
          content?: Json | null
          created_at?: string | null
          file_url?: string | null
          id?: string
          is_public?: boolean | null
          template?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "resumes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      salaries: {
        Row: {
          anonymous: boolean | null
          base_salary: number | null
          bonus: number | null
          company_id: string | null
          created_at: string | null
          education: string | null
          id: string
          is_verified: boolean | null
          job_title: string | null
          level: string | null
          location: string | null
          stock_option: number | null
          total_compensation: number | null
          user_id: string | null
          year: number | null
          years_of_experience: number | null
        }
        Insert: {
          anonymous?: boolean | null
          base_salary?: number | null
          bonus?: number | null
          company_id?: string | null
          created_at?: string | null
          education?: string | null
          id?: string
          is_verified?: boolean | null
          job_title?: string | null
          level?: string | null
          location?: string | null
          stock_option?: number | null
          total_compensation?: number | null
          user_id?: string | null
          year?: number | null
          years_of_experience?: number | null
        }
        Update: {
          anonymous?: boolean | null
          base_salary?: number | null
          bonus?: number | null
          company_id?: string | null
          created_at?: string | null
          education?: string | null
          id?: string
          is_verified?: boolean | null
          job_title?: string | null
          level?: string | null
          location?: string | null
          stock_option?: number | null
          total_compensation?: number | null
          user_id?: string | null
          year?: number | null
          years_of_experience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "salaries_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "salaries_user_id_fkey"
            columns: ["user_id"]
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
      increment_experience_view_count: {
        Args: { experience_id: string }
        Returns: undefined
      }
      increment_job_view_count: {
        Args: { job_id: string }
        Returns: undefined
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
    Enums: {},
  },
} as const