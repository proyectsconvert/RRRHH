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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      applications: {
        Row: {
          analysis_summary: string | null
          candidate_id: string
          created_at: string
          id: string
          job_id: string
          notes: string | null
          status: string
          updated_at: string
        }
        Insert: {
          analysis_summary?: string | null
          candidate_id: string
          created_at?: string
          id?: string
          job_id: string
          notes?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          analysis_summary?: string | null
          candidate_id?: string
          created_at?: string
          id?: string
          job_id?: string
          notes?: string | null
          status?: string
          updated_at?: string
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
            foreignKeyName: "applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          budget: number | null
          created_at: string
          description: string | null
          end_date: string | null
          id: string
          name: string
          platform: string | null
          start_date: string | null
          status: string
          updated_at: string
        }
        Insert: {
          budget?: number | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          name: string
          platform?: string | null
          start_date?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          budget?: number | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          name?: string
          platform?: string | null
          start_date?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      candidates: {
        Row: {
          analysis_summary: string | null
          created_at: string
          email: string
          experience_years: number | null
          first_name: string
          id: string
          last_name: string
          linkedin_url: string | null
          location: string | null
          phone: string | null
          phone_country: string | null
          portfolio_url: string | null
          resume_text: string | null
          resume_url: string | null
          skills: string[] | null
          updated_at: string
        }
        Insert: {
          analysis_summary?: string | null
          created_at?: string
          email: string
          experience_years?: number | null
          first_name: string
          id?: string
          last_name: string
          linkedin_url?: string | null
          location?: string | null
          phone?: string | null
          phone_country?: string | null
          portfolio_url?: string | null
          resume_text?: string | null
          resume_url?: string | null
          skills?: string[] | null
          updated_at?: string
        }
        Update: {
          analysis_summary?: string | null
          created_at?: string
          email?: string
          experience_years?: number | null
          first_name?: string
          id?: string
          last_name?: string
          linkedin_url?: string | null
          location?: string | null
          phone?: string | null
          phone_country?: string | null
          portfolio_url?: string | null
          resume_text?: string | null
          resume_url?: string | null
          skills?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      chatbot_configurations: {
        Row: {
          admin_responses: Json
          id: number
          public_responses: Json
          updated_at: string
        }
        Insert: {
          admin_responses?: Json
          id?: number
          public_responses?: Json
          updated_at?: string
        }
        Update: {
          admin_responses?: Json
          id?: number
          public_responses?: Json
          updated_at?: string
        }
        Relationships: []
      }
      chatbot_knowledge: {
        Row: {
          answer: string
          created_at: string
          id: string
          question: string
          topic: string
          updated_at: string
        }
        Insert: {
          answer: string
          created_at?: string
          id?: string
          question: string
          topic: string
          updated_at?: string
        }
        Update: {
          answer?: string
          created_at?: string
          id?: string
          question?: string
          topic?: string
          updated_at?: string
        }
        Relationships: []
      }
      chatbot_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          role: string
          session_id: string
          user_type: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role: string
          session_id: string
          user_type: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: string
          session_id?: string
          user_type?: string
        }
        Relationships: []
      }
      chatbot_training_codes: {
        Row: {
          active: boolean | null
          client_name: string | null
          client_personality: string | null
          code: string
          created_at: string | null
          expires_at: string | null
          id: string
          interest_level: string | null
          objections: string | null
          product: string | null
        }
        Insert: {
          active?: boolean | null
          client_name?: string | null
          client_personality?: string | null
          code: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          interest_level?: string | null
          objections?: string | null
          product?: string | null
        }
        Update: {
          active?: boolean | null
          client_name?: string | null
          client_personality?: string | null
          code?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          interest_level?: string | null
          objections?: string | null
          product?: string | null
        }
        Relationships: []
      }
      historychat: {
        Row: {
          created_at: string
          hicmessagebot: string | null
          hicmessageuser: string | null
          hicnumerouser: string
          hicsendnumbot: string | null
          hicusername: string
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          hicmessagebot?: string | null
          hicmessageuser?: string | null
          hicnumerouser: string
          hicsendnumbot?: string | null
          hicusername: string
          id?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          hicmessagebot?: string | null
          hicmessageuser?: string | null
          hicnumerouser?: string
          hicsendnumbot?: string | null
          hicusername?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      jobs: {
        Row: {
          campaign_id: string | null
          created_at: string
          department: string
          description: string
          id: string
          location: string
          requirements: string | null
          responsibilities: string | null
          salary_range: string | null
          status: string
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          campaign_id?: string | null
          created_at?: string
          department: string
          description: string
          id?: string
          location: string
          requirements?: string | null
          responsibilities?: string | null
          salary_range?: string | null
          status?: string
          title: string
          type?: string
          updated_at?: string
        }
        Update: {
          campaign_id?: string | null
          created_at?: string
          department?: string
          description?: string
          id?: string
          location?: string
          requirements?: string | null
          responsibilities?: string | null
          salary_range?: string | null
          status?: string
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          email: string | null
          first_name: string | null
          id: string
          last_name: string | null
        }
        Insert: {
          email?: string | null
          first_name?: string | null
          id: string
          last_name?: string | null
        }
        Update: {
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
        }
        Relationships: []
      }
      reports: {
        Row: {
          created_at: string
          id: string
          name: string
          parameters: Json | null
          result: Json | null
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          parameters?: Json | null
          result?: Json | null
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          parameters?: Json | null
          result?: Json | null
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      rrhh_absence_requests: {
        Row: {
          absence_type: string
          approved_at: string | null
          approved_by: string | null
          created_at: string | null
          days_requested: number
          employee_id: string
          end_date: string
          id: string
          reason: string
          rejection_reason: string | null
          start_date: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          absence_type: string
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          days_requested: number
          employee_id: string
          end_date: string
          id?: string
          reason: string
          rejection_reason?: string | null
          start_date: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          absence_type?: string
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          days_requested?: number
          employee_id?: string
          end_date?: string
          id?: string
          reason?: string
          rejection_reason?: string | null
          start_date?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rrhh_absence_requests_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "rrhh_employees_master"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rrhh_absence_requests_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "rrhh_employees_master"
            referencedColumns: ["id"]
          },
        ]
      }
      rrhh_attendance: {
        Row: {
          break_duration_minutes: number | null
          break_end_time: string | null
          break_start_time: string | null
          check_in_location: Json | null
          check_in_time: string | null
          check_out_location: Json | null
          check_out_time: string | null
          comments: string | null
          created_at: string | null
          date: string
          employee_id: string
          expected_hours: number | null
          holiday_name: string | null
          hours_worked: number | null
          id: string
          is_holiday: boolean | null
          notes: string | null
          overtime_hours: number | null
          status: string | null
          total_break_minutes: number | null
          updated_at: string | null
          work_type: string | null
        }
        Insert: {
          break_duration_minutes?: number | null
          break_end_time?: string | null
          break_start_time?: string | null
          check_in_location?: Json | null
          check_in_time?: string | null
          check_out_location?: Json | null
          check_out_time?: string | null
          comments?: string | null
          created_at?: string | null
          date: string
          employee_id: string
          expected_hours?: number | null
          holiday_name?: string | null
          hours_worked?: number | null
          id?: string
          is_holiday?: boolean | null
          notes?: string | null
          overtime_hours?: number | null
          status?: string | null
          total_break_minutes?: number | null
          updated_at?: string | null
          work_type?: string | null
        }
        Update: {
          break_duration_minutes?: number | null
          break_end_time?: string | null
          break_start_time?: string | null
          check_in_location?: Json | null
          check_in_time?: string | null
          check_out_location?: Json | null
          check_out_time?: string | null
          comments?: string | null
          created_at?: string | null
          date?: string
          employee_id?: string
          expected_hours?: number | null
          holiday_name?: string | null
          hours_worked?: number | null
          id?: string
          is_holiday?: boolean | null
          notes?: string | null
          overtime_hours?: number | null
          status?: string | null
          total_break_minutes?: number | null
          updated_at?: string | null
          work_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rrhh_attendance_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "rrhh_employees_master"
            referencedColumns: ["id"]
          },
        ]
      }
      rrhh_benefits: {
        Row: {
          benefit_type: string
          created_at: string | null
          description: string | null
          eligibility_criteria: Json | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
          value_amount: number | null
          value_type: string | null
        }
        Insert: {
          benefit_type: string
          created_at?: string | null
          description?: string | null
          eligibility_criteria?: Json | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
          value_amount?: number | null
          value_type?: string | null
        }
        Update: {
          benefit_type?: string
          created_at?: string | null
          description?: string | null
          eligibility_criteria?: Json | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
          value_amount?: number | null
          value_type?: string | null
        }
        Relationships: []
      }
      rrhh_calendar_events: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          end_datetime: string
          event_type: string
          id: string
          is_all_day: boolean | null
          location: string | null
          recurrence_pattern: string | null
          start_datetime: string
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_datetime: string
          event_type: string
          id?: string
          is_all_day?: boolean | null
          location?: string | null
          recurrence_pattern?: string | null
          start_datetime: string
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_datetime?: string
          event_type?: string
          id?: string
          is_all_day?: boolean | null
          location?: string | null
          recurrence_pattern?: string | null
          start_datetime?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rrhh_calendar_events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "rrhh_employees_master"
            referencedColumns: ["id"]
          },
        ]
      }
      rrhh_compensation: {
        Row: {
          amount: number
          approved_at: string | null
          approved_by: string | null
          compensation_type: string
          created_at: string | null
          currency: string | null
          employee_id: string
          id: string
          performance_metrics: Json | null
          period_end: string | null
          period_start: string | null
          reason: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          approved_at?: string | null
          approved_by?: string | null
          compensation_type: string
          created_at?: string | null
          currency?: string | null
          employee_id: string
          id?: string
          performance_metrics?: Json | null
          period_end?: string | null
          period_start?: string | null
          reason?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          approved_at?: string | null
          approved_by?: string | null
          compensation_type?: string
          created_at?: string | null
          currency?: string | null
          employee_id?: string
          id?: string
          performance_metrics?: Json | null
          period_end?: string | null
          period_start?: string | null
          reason?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rrhh_compensation_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "rrhh_employees_master"
            referencedColumns: ["id"]
          },
        ]
      }
      rrhh_departments_master: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      rrhh_digital_signatures: {
        Row: {
          content: string
          created_at: string | null
          created_by: string | null
          expires_at: string | null
          id: string
          recipient_email: string
          recipient_name: string | null
          signature_link: string | null
          signed_at: string | null
          signed_data: Json | null
          status: string | null
          template_name: string
        }
        Insert: {
          content: string
          created_at?: string | null
          created_by?: string | null
          expires_at?: string | null
          id?: string
          recipient_email: string
          recipient_name?: string | null
          signature_link?: string | null
          signed_at?: string | null
          signed_data?: Json | null
          status?: string | null
          template_name: string
        }
        Update: {
          content?: string
          created_at?: string | null
          created_by?: string | null
          expires_at?: string | null
          id?: string
          recipient_email?: string
          recipient_name?: string | null
          signature_link?: string | null
          signed_at?: string | null
          signed_data?: Json | null
          status?: string | null
          template_name?: string
        }
        Relationships: []
      }
      rrhh_document_permissions: {
        Row: {
          document_id: string
          granted_at: string | null
          granted_by: string | null
          id: string
          permission_type: string
          user_id: string
        }
        Insert: {
          document_id: string
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          permission_type: string
          user_id: string
        }
        Update: {
          document_id?: string
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          permission_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rrhh_document_permissions_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "rrhh_employee_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      rrhh_employee_benefits: {
        Row: {
          assigned_date: string
          benefit_id: string
          created_at: string | null
          effective_date: string
          employee_id: string
          expiry_date: string | null
          id: string
          is_active: boolean | null
        }
        Insert: {
          assigned_date: string
          benefit_id: string
          created_at?: string | null
          effective_date: string
          employee_id: string
          expiry_date?: string | null
          id?: string
          is_active?: boolean | null
        }
        Update: {
          assigned_date?: string
          benefit_id?: string
          created_at?: string | null
          effective_date?: string
          employee_id?: string
          expiry_date?: string | null
          id?: string
          is_active?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "rrhh_employee_benefits_benefit_id_fkey"
            columns: ["benefit_id"]
            isOneToOne: false
            referencedRelation: "rrhh_benefits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rrhh_employee_benefits_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "rrhh_employees_master"
            referencedColumns: ["id"]
          },
        ]
      }
      rrhh_employee_documents: {
        Row: {
          created_at: string | null
          document_name: string
          document_type: string
          employee_id: string | null
          file_path: string
          file_size: number | null
          id: string
          is_required: boolean | null
          mime_type: string | null
          updated_at: string | null
          uploaded_by: string | null
          visibility: string | null
        }
        Insert: {
          created_at?: string | null
          document_name: string
          document_type: string
          employee_id?: string | null
          file_path: string
          file_size?: number | null
          id?: string
          is_required?: boolean | null
          mime_type?: string | null
          updated_at?: string | null
          uploaded_by?: string | null
          visibility?: string | null
        }
        Update: {
          created_at?: string | null
          document_name?: string
          document_type?: string
          employee_id?: string | null
          file_path?: string
          file_size?: number | null
          id?: string
          is_required?: boolean | null
          mime_type?: string | null
          updated_at?: string | null
          uploaded_by?: string | null
          visibility?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rrhh_employee_documents_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "rrhh_employees_master"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rrhh_employee_documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "rrhh_employees_master"
            referencedColumns: ["id"]
          },
        ]
      }
      rrhh_employee_edits: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          edited_at: string | null
          edited_by: string | null
          employee_id: string
          field_name: string
          id: string
          new_value: string | null
          old_value: string | null
          status: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          edited_at?: string | null
          edited_by?: string | null
          employee_id: string
          field_name: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          status?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          edited_at?: string | null
          edited_by?: string | null
          employee_id?: string
          field_name?: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rrhh_employee_edits_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "rrhh_employees_master"
            referencedColumns: ["id"]
          },
        ]
      }
      rrhh_employee_notes: {
        Row: {
          created_at: string
          created_by: string
          employee_id: string
          id: string
          is_confidential: boolean | null
          note_content: string
          note_type: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          employee_id: string
          id?: string
          is_confidential?: boolean | null
          note_content: string
          note_type?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          employee_id?: string
          id?: string
          is_confidential?: boolean | null
          note_content?: string
          note_type?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      rrhh_employees_master: {
        Row: {
          created_at: string | null
          department_id: string | null
          email: string
          employment_type: string | null
          first_name: string
          full_name: string | null
          hire_date: string | null
          id: string
          last_name: string
          position: string
          status: string | null
          team_id: string | null
          updated_at: string | null
          work_center_id: string | null
        }
        Insert: {
          created_at?: string | null
          department_id?: string | null
          email: string
          employment_type?: string | null
          first_name: string
          full_name?: string | null
          hire_date?: string | null
          id?: string
          last_name: string
          position: string
          status?: string | null
          team_id?: string | null
          updated_at?: string | null
          work_center_id?: string | null
        }
        Update: {
          created_at?: string | null
          department_id?: string | null
          email?: string
          employment_type?: string | null
          first_name?: string
          full_name?: string | null
          hire_date?: string | null
          id?: string
          last_name?: string
          position?: string
          status?: string | null
          team_id?: string | null
          updated_at?: string | null
          work_center_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rrhh_employees_master_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "rrhh_departments_master"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rrhh_employees_master_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "rrhh_teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rrhh_employees_master_work_center_id_fkey"
            columns: ["work_center_id"]
            isOneToOne: false
            referencedRelation: "rrhh_work_centers"
            referencedColumns: ["id"]
          },
        ]
      }
      rrhh_event_participants: {
        Row: {
          created_at: string | null
          employee_id: string
          event_id: string
          id: string
          status: string | null
        }
        Insert: {
          created_at?: string | null
          employee_id: string
          event_id: string
          id?: string
          status?: string | null
        }
        Update: {
          created_at?: string | null
          employee_id?: string
          event_id?: string
          id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rrhh_event_participants_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "rrhh_employees_master"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rrhh_event_participants_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "rrhh_calendar_events"
            referencedColumns: ["id"]
          },
        ]
      }
      rrhh_feedback: {
        Row: {
          created_at: string | null
          id: string
          message: string
          type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          message: string
          type: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string
          type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      rrhh_goals: {
        Row: {
          completion_date: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          employee_id: string | null
          goal_type: string
          id: string
          priority: string | null
          progress_percentage: number | null
          start_date: string
          status: string | null
          target_date: string
          team_id: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          completion_date?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          employee_id?: string | null
          goal_type: string
          id?: string
          priority?: string | null
          progress_percentage?: number | null
          start_date: string
          status?: string | null
          target_date: string
          team_id?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          completion_date?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          employee_id?: string | null
          goal_type?: string
          id?: string
          priority?: string | null
          progress_percentage?: number | null
          start_date?: string
          status?: string | null
          target_date?: string
          team_id?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rrhh_goals_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "rrhh_employees_master"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rrhh_goals_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "rrhh_employees_master"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rrhh_goals_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "rrhh_teams"
            referencedColumns: ["id"]
          },
        ]
      }
      rrhh_integration_logs: {
        Row: {
          created_at: string | null
          data: Json | null
          id: string
          integration_id: string
          message: string | null
          operation: string
          status: string
        }
        Insert: {
          created_at?: string | null
          data?: Json | null
          id?: string
          integration_id: string
          message?: string | null
          operation: string
          status: string
        }
        Update: {
          created_at?: string | null
          data?: Json | null
          id?: string
          integration_id?: string
          message?: string | null
          operation?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "rrhh_integration_logs_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "rrhh_system_integrations"
            referencedColumns: ["id"]
          },
        ]
      }
      rrhh_integrations: {
        Row: {
          config_data: Json
          created_at: string | null
          id: string
          integration_name: string
          integration_type: string
          is_active: boolean | null
          last_sync: string | null
          updated_at: string | null
        }
        Insert: {
          config_data: Json
          created_at?: string | null
          id?: string
          integration_name: string
          integration_type: string
          is_active?: boolean | null
          last_sync?: string | null
          updated_at?: string | null
        }
        Update: {
          config_data?: Json
          created_at?: string | null
          id?: string
          integration_name?: string
          integration_type?: string
          is_active?: boolean | null
          last_sync?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      rrhh_messages: {
        Row: {
          attachments: Json | null
          content: string
          created_at: string | null
          id: string
          message_type: string | null
          parent_message_id: string | null
          priority: string | null
          read_at: string | null
          recipient_id: string | null
          sender_id: string | null
          status: string | null
          subject: string
        }
        Insert: {
          attachments?: Json | null
          content: string
          created_at?: string | null
          id?: string
          message_type?: string | null
          parent_message_id?: string | null
          priority?: string | null
          read_at?: string | null
          recipient_id?: string | null
          sender_id?: string | null
          status?: string | null
          subject: string
        }
        Update: {
          attachments?: Json | null
          content?: string
          created_at?: string | null
          id?: string
          message_type?: string | null
          parent_message_id?: string | null
          priority?: string | null
          read_at?: string | null
          recipient_id?: string | null
          sender_id?: string | null
          status?: string | null
          subject?: string
        }
        Relationships: [
          {
            foreignKeyName: "rrhh_messages_parent_message_id_fkey"
            columns: ["parent_message_id"]
            isOneToOne: false
            referencedRelation: "rrhh_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rrhh_messages_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "rrhh_employees_master"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rrhh_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "rrhh_employees_master"
            referencedColumns: ["id"]
          },
        ]
      }
      rrhh_news: {
        Row: {
          content: string
          created_at: string | null
          id: string
          title: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          title: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          title?: string
        }
        Relationships: []
      }
      rrhh_notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          type: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      rrhh_organizational_structure: {
        Row: {
          created_at: string | null
          department_id: string | null
          employee_id: string | null
          id: string
          is_department_head: boolean | null
          manager_id: string | null
          position_level: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          department_id?: string | null
          employee_id?: string | null
          id?: string
          is_department_head?: boolean | null
          manager_id?: string | null
          position_level?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          department_id?: string | null
          employee_id?: string | null
          id?: string
          is_department_head?: boolean | null
          manager_id?: string | null
          position_level?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rrhh_organizational_structure_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "rrhh_departments_master"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rrhh_organizational_structure_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: true
            referencedRelation: "rrhh_employees_master"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rrhh_organizational_structure_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "rrhh_employees_master"
            referencedColumns: ["id"]
          },
        ]
      }
      rrhh_payroll: {
        Row: {
          base_salary: number
          bonuses: number | null
          created_at: string | null
          deductions: number | null
          employee_id: string
          gross_pay: number
          id: string
          net_pay: number
          overtime_pay: number | null
          payment_date: string | null
          period_month: number
          period_year: number
          status: string | null
          taxes: number | null
          updated_at: string | null
        }
        Insert: {
          base_salary: number
          bonuses?: number | null
          created_at?: string | null
          deductions?: number | null
          employee_id: string
          gross_pay: number
          id?: string
          net_pay: number
          overtime_pay?: number | null
          payment_date?: string | null
          period_month: number
          period_year: number
          status?: string | null
          taxes?: number | null
          updated_at?: string | null
        }
        Update: {
          base_salary?: number
          bonuses?: number | null
          created_at?: string | null
          deductions?: number | null
          employee_id?: string
          gross_pay?: number
          id?: string
          net_pay?: number
          overtime_pay?: number | null
          payment_date?: string | null
          period_month?: number
          period_year?: number
          status?: string | null
          taxes?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rrhh_payroll_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "rrhh_employees_master"
            referencedColumns: ["id"]
          },
        ]
      }
      rrhh_performance_evaluations: {
        Row: {
          areas_improvement: string | null
          competencies: Json | null
          created_at: string | null
          development_plan: string | null
          employee_id: string
          evaluator_id: string
          goals_achieved: Json | null
          id: string
          overall_score: number | null
          period_end: string
          period_start: string
          status: string | null
          strengths: string | null
          updated_at: string | null
        }
        Insert: {
          areas_improvement?: string | null
          competencies?: Json | null
          created_at?: string | null
          development_plan?: string | null
          employee_id: string
          evaluator_id: string
          goals_achieved?: Json | null
          id?: string
          overall_score?: number | null
          period_end: string
          period_start: string
          status?: string | null
          strengths?: string | null
          updated_at?: string | null
        }
        Update: {
          areas_improvement?: string | null
          competencies?: Json | null
          created_at?: string | null
          development_plan?: string | null
          employee_id?: string
          evaluator_id?: string
          goals_achieved?: Json | null
          id?: string
          overall_score?: number | null
          period_end?: string
          period_start?: string
          status?: string | null
          strengths?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rrhh_performance_evaluations_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "rrhh_employees_master"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rrhh_performance_evaluations_evaluator_id_fkey"
            columns: ["evaluator_id"]
            isOneToOne: false
            referencedRelation: "rrhh_employees_master"
            referencedColumns: ["id"]
          },
        ]
      }
      rrhh_performance_reviews: {
        Row: {
          created_at: string | null
          feedback: string | null
          id: string
          period: string | null
          reviewer_id: string | null
          score: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          feedback?: string | null
          id?: string
          period?: string | null
          reviewer_id?: string | null
          score?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          feedback?: string | null
          id?: string
          period?: string | null
          reviewer_id?: string | null
          score?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      rrhh_reports: {
        Row: {
          expires_at: string | null
          file_path: string | null
          generated_at: string | null
          generated_by: string | null
          id: string
          parameters: Json | null
          report_name: string
          report_type: string
        }
        Insert: {
          expires_at?: string | null
          file_path?: string | null
          generated_at?: string | null
          generated_by?: string | null
          id?: string
          parameters?: Json | null
          report_name: string
          report_type: string
        }
        Update: {
          expires_at?: string | null
          file_path?: string | null
          generated_at?: string | null
          generated_by?: string | null
          id?: string
          parameters?: Json | null
          report_name?: string
          report_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "rrhh_reports_generated_by_fkey"
            columns: ["generated_by"]
            isOneToOne: false
            referencedRelation: "rrhh_employees_master"
            referencedColumns: ["id"]
          },
        ]
      }
      rrhh_survey_responses: {
        Row: {
          completed: boolean | null
          created_at: string | null
          employee_id: string
          id: string
          responses: Json
          submitted_at: string | null
          survey_id: string
        }
        Insert: {
          completed?: boolean | null
          created_at?: string | null
          employee_id: string
          id?: string
          responses?: Json
          submitted_at?: string | null
          survey_id: string
        }
        Update: {
          completed?: boolean | null
          created_at?: string | null
          employee_id?: string
          id?: string
          responses?: Json
          submitted_at?: string | null
          survey_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rrhh_survey_responses_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "rrhh_employees_master"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rrhh_survey_responses_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "rrhh_surveys"
            referencedColumns: ["id"]
          },
        ]
      }
      rrhh_surveys: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          end_date: string | null
          id: string
          is_active: boolean | null
          questions: Json
          start_date: string | null
          survey_type: string
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          questions?: Json
          start_date?: string | null
          survey_type: string
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          questions?: Json
          start_date?: string | null
          survey_type?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      rrhh_system_config: {
        Row: {
          config_key: string
          config_value: Json
          description: string | null
          id: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          config_key: string
          config_value: Json
          description?: string | null
          id?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          config_key?: string
          config_value?: Json
          description?: string | null
          id?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rrhh_system_config_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "rrhh_employees_master"
            referencedColumns: ["id"]
          },
        ]
      }
      rrhh_system_integrations: {
        Row: {
          api_endpoint: string | null
          auth_method: string | null
          config: Json
          created_at: string | null
          credentials: Json | null
          description: string | null
          id: string
          integration_type: string
          is_active: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          api_endpoint?: string | null
          auth_method?: string | null
          config?: Json
          created_at?: string | null
          credentials?: Json | null
          description?: string | null
          id?: string
          integration_type: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          api_endpoint?: string | null
          auth_method?: string | null
          config?: Json
          created_at?: string | null
          credentials?: Json | null
          description?: string | null
          id?: string
          integration_type?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      rrhh_teams: {
        Row: {
          created_at: string | null
          department_id: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          department_id?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          department_id?: string | null
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "rrhh_teams_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "rrhh_departments_master"
            referencedColumns: ["id"]
          },
        ]
      }
      rrhh_wellness: {
        Row: {
          category: string
          content: string
          created_at: string | null
          external_url: string | null
          id: string
          is_active: boolean | null
          resource_type: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          category: string
          content: string
          created_at?: string | null
          external_url?: string | null
          id?: string
          is_active?: boolean | null
          resource_type?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: string
          content?: string
          created_at?: string | null
          external_url?: string | null
          id?: string
          is_active?: boolean | null
          resource_type?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      rrhh_work_centers: {
        Row: {
          country_code: string | null
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          country_code?: string | null
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          country_code?: string | null
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          company_name: string
          created_at: string
          email_notifications: boolean
          id: string
          language: string
          settings: Json | null
          theme: string
          updated_at: string
        }
        Insert: {
          company_name?: string
          created_at?: string
          email_notifications?: boolean
          id?: string
          language?: string
          settings?: Json | null
          theme?: string
          updated_at?: string
        }
        Update: {
          company_name?: string
          created_at?: string
          email_notifications?: boolean
          id?: string
          language?: string
          settings?: Json | null
          theme?: string
          updated_at?: string
        }
        Relationships: []
      }
      training_codes: {
        Row: {
          code: string
          created_at: string
          expires_at: string
          id: string
          is_used: boolean | null
        }
        Insert: {
          code: string
          created_at?: string
          expires_at: string
          id?: string
          is_used?: boolean | null
        }
        Update: {
          code?: string
          created_at?: string
          expires_at?: string
          id?: string
          is_used?: boolean | null
        }
        Relationships: []
      }
      training_evaluations: {
        Row: {
          areas_to_improve: string | null
          created_at: string
          id: string
          recommendations: string | null
          session_id: string
          strengths: string | null
          updated_at: string
        }
        Insert: {
          areas_to_improve?: string | null
          created_at?: string
          id?: string
          recommendations?: string | null
          session_id: string
          strengths?: string | null
          updated_at?: string
        }
        Update: {
          areas_to_improve?: string | null
          created_at?: string
          id?: string
          recommendations?: string | null
          session_id?: string
          strengths?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_evaluations_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: true
            referencedRelation: "training_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      training_messages: {
        Row: {
          content: string
          id: string
          sender_type: string
          sent_at: string
          session_id: string
        }
        Insert: {
          content: string
          id?: string
          sender_type: string
          sent_at?: string
          session_id: string
        }
        Update: {
          content?: string
          id?: string
          sender_type?: string
          sent_at?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "training_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      training_sessions: {
        Row: {
          candidate_name: string
          ended_at: string | null
          feedback: string | null
          id: string
          public_visible: boolean | null
          score: number | null
          started_at: string
          training_code_id: string
        }
        Insert: {
          candidate_name: string
          ended_at?: string | null
          feedback?: string | null
          id?: string
          public_visible?: boolean | null
          score?: number | null
          started_at?: string
          training_code_id: string
        }
        Update: {
          candidate_name?: string
          ended_at?: string | null
          feedback?: string | null
          id?: string
          public_visible?: boolean | null
          score?: number | null
          started_at?: string
          training_code_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_sessions_training_code_id_fkey"
            columns: ["training_code_id"]
            isOneToOne: false
            referencedRelation: "training_codes"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_absence_request: {
        Args: {
          p_absence_type: string
          p_employee_id: string
          p_end_date: string
          p_reason: string
          p_start_date: string
        }
        Returns: string
      }
      create_employee_note: {
        Args: {
          p_created_by: string
          p_employee_id: string
          p_is_confidential?: boolean
          p_note_content: string
          p_note_type?: string
        }
        Returns: string
      }
      create_enable_realtime_function: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      create_get_complete_training_sessions_function: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      create_or_update_application: {
        Args: {
          p_cover_letter: string
          p_email: string
          p_first_name: string
          p_job_id: string
          p_job_type: string
          p_last_name: string
          p_phone: string
          p_phone_country: string
          p_resume_url: string
        }
        Returns: string
      }
      create_rrhh_message: {
        Args: {
          p_content: string
          p_message_type?: string
          p_recipient_id: string
          p_sender_id: string
          p_subject: string
        }
        Returns: string
      }
      get_complete_training_session: {
        Args: { p_session_id: string }
        Returns: {
          areas_to_improve: string
          candidate_name: string
          ended_at: string
          feedback: string
          id: string
          messages: Json
          public_visible: boolean
          recommendations: string
          score: number
          started_at: string
          strengths: string
          training_code: string
        }[]
      }
      get_complete_training_sessions: {
        Args: Record<PropertyKey, never>
        Returns: {
          areas_to_improve: string
          candidate_name: string
          ended_at: string
          feedback: string
          id: string
          messages: Json
          public_visible: boolean
          recommendations: string
          score: number
          started_at: string
          strengths: string
          training_code: string
        }[]
      }
      get_employee_calendar: {
        Args: { p_employee_id: string; p_month: number; p_year: number }
        Returns: {
          attendance_id: string
          break_duration_minutes: number
          break_end_time: string
          break_start_time: string
          check_in_time: string
          check_out_time: string
          comments: string
          date: string
          day_name: string
          expected_hours: number
          holiday_name: string
          hours_worked: number
          is_holiday: boolean
          is_weekend: boolean
          overtime_hours: number
          status: string
          work_type: string
        }[]
      }
      get_employee_monthly_stats: {
        Args: { p_employee_id: string; p_month: number; p_year: number }
        Returns: {
          attendance_percentage: number
          days_absent: number
          days_present: number
          total_days_worked: number
          total_expected_hours: number
          total_hours_worked: number
          total_overtime_hours: number
        }[]
      }
      get_job_by_id: {
        Args: { p_job_id: string }
        Returns: {
          application_count: number
          campaign_id: string
          created_at: string
          department: string
          description: string
          id: string
          location: string
          requirements: string
          responsibilities: string
          salary_range: string
          status: string
          title: string
          type: string
          updated_at: string
        }[]
      }
      is_rrhh_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      migrate_sessions_to_evaluations: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      register_attendance: {
        Args: {
          p_check_in_time?: string
          p_check_out_time?: string
          p_date?: string
          p_employee_id: string
        }
        Returns: string
      }
      register_attendance_improved: {
        Args: {
          p_date?: string
          p_employee_id: string
          p_hours_worked?: number
        }
        Returns: string
      }
      register_attendance_with_break: {
        Args: {
          p_break_end_time?: string
          p_break_start_time?: string
          p_check_in_time?: string
          p_check_out_time?: string
          p_date?: string
          p_employee_id: string
        }
        Returns: string
      }
      update_attendance_record: {
        Args: {
          p_break_end_time?: string
          p_break_start_time?: string
          p_check_in_time?: string
          p_check_out_time?: string
          p_comments?: string
          p_date: string
          p_employee_id: string
          p_holiday_name?: string
          p_is_holiday?: boolean
          p_work_type?: string
        }
        Returns: string
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
