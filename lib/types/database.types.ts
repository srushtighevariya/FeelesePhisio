export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string;
          role: "admin" | "therapist";
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name: string;
          role: "admin" | "therapist";
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["users"]["Insert"]>;
      };
      therapists: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          specialty: string | null;
          phone: string | null;
          email: string | null;
          patient_count: number;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["therapists"]["Row"], "id" | "created_at" | "patient_count"> & { id?: string; created_at?: string; patient_count?: number };
        Update: Partial<Database["public"]["Tables"]["therapists"]["Insert"]>;
      };
      patients: {
        Row: {
          id: string;
          code: string | null;
          name: string;
          age: number | null;
          gender: string | null;
          phone: string | null;
          email: string | null;
          address: string | null;
          emergency_contact: string | null;
          referred_by: string | null;
          diagnosis: string | null;
          status: string;
          therapist_id: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["patients"]["Row"], "id" | "created_at"> & { id?: string; created_at?: string; code?: string | null };
        Update: Partial<Database["public"]["Tables"]["patients"]["Insert"]>;
      };
      appointments: {
        Row: {
          id: string;
          patient_id: string;
          therapist_id: string;
          date: string;
          time: string | null;
          type: string | null;
          status: string;
          notes: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["appointments"]["Row"], "id" | "created_at"> & { id?: string; created_at?: string };
        Update: Partial<Database["public"]["Tables"]["appointments"]["Insert"]>;
      };
      sessions: {
        Row: {
          id: string;
          patient_id: string;
          therapist_id: string;
          date: string;
          type: string | null;
          pain_before: number | null;
          pain_after: number | null;
          notes: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["sessions"]["Row"], "id" | "created_at"> & { id?: string; created_at?: string };
        Update: Partial<Database["public"]["Tables"]["sessions"]["Insert"]>;
      };
      assessments: {
        Row: {
          id: string;
          patient_id: string;
          chief_complaint: string | null;
          history: string | null;
          diagnosis: string | null;
          contraindications: string | null;
          goals: string | null;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["assessments"]["Row"], "id" | "updated_at"> & { id?: string; updated_at?: string };
        Update: Partial<Database["public"]["Tables"]["assessments"]["Insert"]>;
      };
      treatment_plans: {
        Row: {
          id: string;
          patient_id: string;
          start_date: string | null;
          end_date: string | null;
          items: Json;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["treatment_plans"]["Row"], "id" | "updated_at"> & { id?: string; updated_at?: string };
        Update: Partial<Database["public"]["Tables"]["treatment_plans"]["Insert"]>;
      };
      exercises: {
        Row: {
          id: string;
          name: string;
          category: string | null;
          body_part: string | null;
          sets: number | null;
          reps: number | null;
          duration_min: number | null;
          level: string | null;
          description: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["exercises"]["Row"], "id" | "created_at"> & { id?: string; created_at?: string };
        Update: Partial<Database["public"]["Tables"]["exercises"]["Insert"]>;
      };
      attendance: {
        Row: {
          id: string;
          therapist_id: string;
          date: string;
          check_in: string | null;
          check_out: string | null;
          status: "Present" | "Half-Day" | "Leave" | "Absent";
          hours_worked: number | null;
          notes: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["attendance"]["Row"], "id" | "created_at"> & { id?: string; created_at?: string };
        Update: Partial<Database["public"]["Tables"]["attendance"]["Insert"]>;
      };
      monthly_reports: {
        Row: {
          id: string;
          therapist_id: string;
          month: string;
          clinical_learning: string | null;
          google_reviews: number | null;
          video_patients: number | null;
          success_stories: string | null;
          remark: string | null;
          saved_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["monthly_reports"]["Row"], "id" | "saved_at"> & { id?: string; saved_at?: string };
        Update: Partial<Database["public"]["Tables"]["monthly_reports"]["Insert"]>;
      };
      notification_log: {
        Row: {
          id: string;
          type: string;
          patient_id: string | null;
          therapist_id: string | null;
          message: string | null;
          sent_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["notification_log"]["Row"], "id" | "sent_at"> & { id?: string; sent_at?: string };
        Update: Partial<Database["public"]["Tables"]["notification_log"]["Insert"]>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}

// Convenience row types
export type UserRow        = Database["public"]["Tables"]["users"]["Row"];
export type TherapistRow   = Database["public"]["Tables"]["therapists"]["Row"];
export type PatientRow     = Database["public"]["Tables"]["patients"]["Row"];
export type AppointmentRow = Database["public"]["Tables"]["appointments"]["Row"];
export type SessionRow     = Database["public"]["Tables"]["sessions"]["Row"];
export type AssessmentRow  = Database["public"]["Tables"]["assessments"]["Row"];
export type TreatmentRow   = Database["public"]["Tables"]["treatment_plans"]["Row"];
export type ExerciseRow    = Database["public"]["Tables"]["exercises"]["Row"];
export type AttendanceRow  = Database["public"]["Tables"]["attendance"]["Row"];
export type MonthlyReportRow  = Database["public"]["Tables"]["monthly_reports"]["Row"];
export type NotificationRow   = Database["public"]["Tables"]["notification_log"]["Row"];
