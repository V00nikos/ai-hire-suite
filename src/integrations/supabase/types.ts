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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      activity_log: {
        Row: {
          actor_id: string | null
          application_id: string | null
          candidate_id: string | null
          created_at: string | null
          event_data: Json | null
          event_type: string
          id: string
          job_id: string | null
        }
        Insert: {
          actor_id?: string | null
          application_id?: string | null
          candidate_id?: string | null
          created_at?: string | null
          event_data?: Json | null
          event_type: string
          id?: string
          job_id?: string | null
        }
        Update: {
          actor_id?: string | null
          application_id?: string | null
          candidate_id?: string | null
          created_at?: string | null
          event_data?: Json | null
          event_type?: string
          id?: string
          job_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_log_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_log_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_log_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_log_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_evaluations: {
        Row: {
          application_id: string
          evaluated_at: string | null
          form_version_id: string | null
          hiring_manager_notes: string | null
          id: string
          interview_questions: Json | null
          model_used: string | null
          overall_score: number | null
          ranking: number | null
          raw_response: Json | null
          recommendation: string | null
          resume_score: number | null
          rubric_scores: Json | null
          score: number | null
          strengths: Json | null
          summary: string | null
          video_score: number | null
          weaknesses: Json | null
        }
        Insert: {
          application_id: string
          evaluated_at?: string | null
          form_version_id?: string | null
          hiring_manager_notes?: string | null
          id?: string
          interview_questions?: Json | null
          model_used?: string | null
          overall_score?: number | null
          ranking?: number | null
          raw_response?: Json | null
          recommendation?: string | null
          resume_score?: number | null
          rubric_scores?: Json | null
          score?: number | null
          strengths?: Json | null
          summary?: string | null
          video_score?: number | null
          weaknesses?: Json | null
        }
        Update: {
          application_id?: string
          evaluated_at?: string | null
          form_version_id?: string | null
          hiring_manager_notes?: string | null
          id?: string
          interview_questions?: Json | null
          model_used?: string | null
          overall_score?: number | null
          ranking?: number | null
          raw_response?: Json | null
          recommendation?: string | null
          resume_score?: number | null
          rubric_scores?: Json | null
          score?: number | null
          strengths?: Json | null
          summary?: string | null
          video_score?: number | null
          weaknesses?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_evaluations_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: true
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_evaluations_form_version_id_fkey"
            columns: ["form_version_id"]
            isOneToOne: false
            referencedRelation: "form_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      application_documents: {
        Row: {
          application_id: string
          document_type: Database["public"]["Enums"]["document_type"]
          file_size: number | null
          file_url: string
          filename: string
          id: string
          uploaded_at: string | null
        }
        Insert: {
          application_id: string
          document_type: Database["public"]["Enums"]["document_type"]
          file_size?: number | null
          file_url: string
          filename: string
          id?: string
          uploaded_at?: string | null
        }
        Update: {
          application_id?: string
          document_type?: Database["public"]["Enums"]["document_type"]
          file_size?: number | null
          file_url?: string
          filename?: string
          id?: string
          uploaded_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "application_documents_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      applications: {
        Row: {
          bulk_uploaded: boolean | null
          candidate_id: string
          external_id: string | null
          form_version_id: string | null
          id: string
          job_id: string
          shortlisted: boolean | null
          shortlisted_at: string | null
          status: Database["public"]["Enums"]["application_status"] | null
          submitted_at: string | null
          synced_at: string | null
          synced_to_external: boolean | null
        }
        Insert: {
          bulk_uploaded?: boolean | null
          candidate_id: string
          external_id?: string | null
          form_version_id?: string | null
          id?: string
          job_id: string
          shortlisted?: boolean | null
          shortlisted_at?: string | null
          status?: Database["public"]["Enums"]["application_status"] | null
          submitted_at?: string | null
          synced_at?: string | null
          synced_to_external?: boolean | null
        }
        Update: {
          bulk_uploaded?: boolean | null
          candidate_id?: string
          external_id?: string | null
          form_version_id?: string | null
          id?: string
          job_id?: string
          shortlisted?: boolean | null
          shortlisted_at?: string | null
          status?: Database["public"]["Enums"]["application_status"] | null
          submitted_at?: string | null
          synced_at?: string | null
          synced_to_external?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "applications_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_form_version_id_fkey"
            columns: ["form_version_id"]
            isOneToOne: false
            referencedRelation: "form_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      candidate_documents: {
        Row: {
          candidate_id: string
          document_type: Database["public"]["Enums"]["document_type"]
          extracted_text: string | null
          file_size: number | null
          file_url: string
          filename: string
          id: string
          uploaded_at: string | null
        }
        Insert: {
          candidate_id: string
          document_type: Database["public"]["Enums"]["document_type"]
          extracted_text?: string | null
          file_size?: number | null
          file_url: string
          filename: string
          id?: string
          uploaded_at?: string | null
        }
        Update: {
          candidate_id?: string
          document_type?: Database["public"]["Enums"]["document_type"]
          extracted_text?: string | null
          file_size?: number | null
          file_url?: string
          filename?: string
          id?: string
          uploaded_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "candidate_documents_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
        ]
      }
      candidate_notes: {
        Row: {
          application_id: string | null
          author_id: string
          candidate_id: string
          content: string
          created_at: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          application_id?: string | null
          author_id: string
          candidate_id: string
          content: string
          created_at?: string | null
          id?: string
          updated_at?: string | null
        }
        Update: {
          application_id?: string | null
          author_id?: string
          candidate_id?: string
          content?: string
          created_at?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "candidate_notes_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidate_notes_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidate_notes_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
        ]
      }
      candidates: {
        Row: {
          created_at: string | null
          email: string
          id: string
          linkedin_url: string | null
          name: string
          phone: string | null
          portfolio_url: string | null
          source: string | null
          tags: Json | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          linkedin_url?: string | null
          name: string
          phone?: string | null
          portfolio_url?: string | null
          source?: string | null
          tags?: Json | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          linkedin_url?: string | null
          name?: string
          phone?: string | null
          portfolio_url?: string | null
          source?: string | null
          tags?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      form_responses: {
        Row: {
          application_id: string
          created_at: string | null
          field_id: string
          field_label: string
          field_type: string
          form_version_id: string
          id: string
          response_value: Json
        }
        Insert: {
          application_id: string
          created_at?: string | null
          field_id: string
          field_label: string
          field_type: string
          form_version_id: string
          id?: string
          response_value: Json
        }
        Update: {
          application_id?: string
          created_at?: string | null
          field_id?: string
          field_label?: string
          field_type?: string
          form_version_id?: string
          id?: string
          response_value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "form_responses_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_responses_form_version_id_fkey"
            columns: ["form_version_id"]
            isOneToOne: false
            referencedRelation: "form_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      form_versions: {
        Row: {
          change_notes: string | null
          created_at: string | null
          created_by: string | null
          evaluation_rubric: Json | null
          fields: Json
          form_id: string
          id: string
          is_published: boolean | null
          version_number: number
        }
        Insert: {
          change_notes?: string | null
          created_at?: string | null
          created_by?: string | null
          evaluation_rubric?: Json | null
          fields?: Json
          form_id: string
          id?: string
          is_published?: boolean | null
          version_number: number
        }
        Update: {
          change_notes?: string | null
          created_at?: string | null
          created_by?: string | null
          evaluation_rubric?: Json | null
          fields?: Json
          form_id?: string
          id?: string
          is_published?: boolean | null
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "form_versions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_versions_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "forms"
            referencedColumns: ["id"]
          },
        ]
      }
      forms: {
        Row: {
          created_at: string | null
          current_version: number | null
          id: string
          is_active: boolean | null
          job_id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          current_version?: number | null
          id?: string
          is_active?: boolean | null
          job_id: string
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          current_version?: number | null
          id?: string
          is_active?: boolean | null
          job_id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "forms_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: true
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          created_at: string | null
          created_by: string | null
          deadline: string | null
          department: string | null
          description: string | null
          employment_type: Database["public"]["Enums"]["employment_type"] | null
          id: string
          location: string | null
          requirements: string | null
          salary_max: number | null
          salary_min: number | null
          status: Database["public"]["Enums"]["job_status"] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          deadline?: string | null
          department?: string | null
          description?: string | null
          employment_type?:
            | Database["public"]["Enums"]["employment_type"]
            | null
          id?: string
          location?: string | null
          requirements?: string | null
          salary_max?: number | null
          salary_min?: number | null
          status?: Database["public"]["Enums"]["job_status"] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          deadline?: string | null
          department?: string | null
          description?: string | null
          employment_type?:
            | Database["public"]["Enums"]["employment_type"]
            | null
          id?: string
          location?: string | null
          requirements?: string | null
          salary_max?: number | null
          salary_min?: number | null
          status?: Database["public"]["Enums"]["job_status"] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "jobs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notes: {
        Row: {
          application_id: string
          author_id: string
          content: string
          created_at: string | null
          id: string
          note_type: string | null
          updated_at: string | null
        }
        Insert: {
          application_id: string
          author_id: string
          content: string
          created_at?: string | null
          id?: string
          note_type?: string | null
          updated_at?: string | null
        }
        Update: {
          application_id?: string
          author_id?: string
          content?: string
          created_at?: string | null
          id?: string
          note_type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notes_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          last_login_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          last_login_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          last_login_at?: string | null
        }
        Relationships: []
      }
      sync_audit_log: {
        Row: {
          completed_at: string | null
          created_by: string | null
          error_message: string | null
          id: string
          records_failed: number | null
          records_synced: number | null
          started_at: string | null
          status: string | null
          sync_type: string
          table_name: string
        }
        Insert: {
          completed_at?: string | null
          created_by?: string | null
          error_message?: string | null
          id?: string
          records_failed?: number | null
          records_synced?: number | null
          started_at?: string | null
          status?: string | null
          sync_type: string
          table_name: string
        }
        Update: {
          completed_at?: string | null
          created_by?: string | null
          error_message?: string | null
          id?: string
          records_failed?: number | null
          records_synced?: number | null
          started_at?: string | null
          status?: string | null
          sync_type?: string
          table_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "sync_audit_log_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_notifications: {
        Row: {
          activity_log_id: string | null
          created_at: string | null
          id: string
          is_read: boolean | null
          read_at: string | null
          user_id: string
        }
        Insert: {
          activity_log_id?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          read_at?: string | null
          user_id: string
        }
        Update: {
          activity_log_id?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          read_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_notifications_activity_log_id_fkey"
            columns: ["activity_log_id"]
            isOneToOne: false
            referencedRelation: "activity_log"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_recruiter: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "recruiter" | "viewer"
      application_status:
        | "pending"
        | "evaluated"
        | "shortlisted"
        | "rejected"
        | "on_hold"
        | "hired"
        | "withdrawn"
      document_type:
        | "resume"
        | "video"
        | "cover_letter"
        | "portfolio"
        | "linkedin"
        | "assignment"
        | "other"
      employment_type: "full-time" | "part-time" | "contract" | "internship"
      job_status: "draft" | "active" | "paused" | "closed"
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
      app_role: ["admin", "recruiter", "viewer"],
      application_status: [
        "pending",
        "evaluated",
        "shortlisted",
        "rejected",
        "on_hold",
        "hired",
        "withdrawn",
      ],
      document_type: [
        "resume",
        "video",
        "cover_letter",
        "portfolio",
        "linkedin",
        "assignment",
        "other",
      ],
      employment_type: ["full-time", "part-time", "contract", "internship"],
      job_status: ["draft", "active", "paused", "closed"],
    },
  },
} as const
