export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = 'ADMIN' | 'INVESTMENT_MANAGER' | 'INVESTMENT_ASSOCIATE';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          role: UserRole;
          label: string;
          manager_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          role: UserRole;
          label: string;
          manager_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          role?: UserRole;
          label?: string;
          manager_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      startups: {
        Row: {
          id: string;
          name: string;
          one_liner: string;
          sector: string;
          stage: string;
          cohort: string;
          founded_on: string;
          website: string | null;
          city: string;
          manager_id: string;
          associate_id: string | null;
          trl: number;
          trl_updated_on: string;
          ip_status: string;
          ip_ownership_clear: boolean;
          commercial_signal: string;
          grant_sanctioned: number;
          grant_disbursed: number;
          archived: boolean;
          reg_tags: string[];
          investibility: Json | null;
          ai_analysis: Json | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          one_liner?: string;
          sector: string;
          stage: string;
          cohort: string;
          founded_on: string;
          website?: string | null;
          city?: string;
          manager_id: string;
          associate_id?: string | null;
          trl?: number;
          trl_updated_on?: string;
          ip_status?: string;
          ip_ownership_clear?: boolean;
          commercial_signal?: string;
          grant_sanctioned?: number;
          grant_disbursed?: number;
          archived?: boolean;
          reg_tags?: string[];
          investibility?: Json | null;
          ai_analysis?: Json | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          one_liner?: string;
          sector?: string;
          stage?: string;
          cohort?: string;
          founded_on?: string;
          website?: string | null;
          city?: string;
          manager_id?: string;
          associate_id?: string | null;
          trl?: number;
          trl_updated_on?: string;
          ip_status?: string;
          ip_ownership_clear?: boolean;
          commercial_signal?: string;
          grant_sanctioned?: number;
          grant_disbursed?: number;
          archived?: boolean;
          reg_tags?: string[];
          investibility?: Json | null;
          ai_analysis?: Json | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      startup_fitt_trackers: {
        Row: {
          startup_id: string;
          data: Json;
          checked_on: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          startup_id: string;
          data: Json;
          checked_on?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          startup_id?: string;
          data?: Json;
          checked_on?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      founder_links: {
        Row: {
          id: string;
          startup_id: string;
          token_hash: string;
          expires_at: string;
          revoked_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          startup_id: string;
          token_hash: string;
          expires_at: string;
          revoked_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          startup_id?: string;
          token_hash?: string;
          expires_at?: string;
          revoked_at?: string | null;
          created_at?: string;
        };
      };
      team_members: {
        Row: {
          id: string;
          startup_id: string;
          name: string;
          role: string;
          is_founder: boolean;
          full_time: boolean;
          equity_pct: number | null;
          email: string;
          phone: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          startup_id: string;
          name: string;
          role: string;
          is_founder?: boolean;
          full_time?: boolean;
          equity_pct?: number | null;
          email: string;
          phone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          startup_id?: string;
          name?: string;
          role?: string;
          is_founder?: boolean;
          full_time?: boolean;
          equity_pct?: number | null;
          email?: string;
          phone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      milestones: {
        Row: {
          id: string;
          startup_id: string;
          title: string;
          category: string;
          target_date: string;
          revised_date: string | null;
          delay_reason: string | null;
          status: string;
          percent_complete: number;
          evidence_note: string | null;
          evidence_link: string | null;
          completed_on: string | null;
          last_updated_by: string;
          last_updated_on: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          startup_id: string;
          title: string;
          category: string;
          target_date: string;
          revised_date?: string | null;
          delay_reason?: string | null;
          status?: string;
          percent_complete?: number;
          evidence_note?: string | null;
          evidence_link?: string | null;
          completed_on?: string | null;
          last_updated_by?: string;
          last_updated_on: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          startup_id?: string;
          title?: string;
          category?: string;
          target_date?: string;
          revised_date?: string | null;
          delay_reason?: string | null;
          status?: string;
          percent_complete?: number;
          evidence_note?: string | null;
          evidence_link?: string | null;
          completed_on?: string | null;
          last_updated_by?: string;
          last_updated_on?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      monthly_metrics: {
        Row: {
          id: string;
          startup_id: string;
          month: string;
          cash_balance: number;
          monthly_burn: number;
          monthly_revenue: number;
          customer_conversations: number;
          pilots: number;
          lois: number;
          paying_customers: number;
          team_full_time: number;
          team_part_time: number;
          key_learnings: string | null;
          source: string;
          recorded_on: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          startup_id: string;
          month: string;
          cash_balance?: number;
          monthly_burn?: number;
          monthly_revenue?: number;
          customer_conversations?: number;
          pilots?: number;
          lois?: number;
          paying_customers?: number;
          team_full_time?: number;
          team_part_time?: number;
          key_learnings?: string | null;
          source?: string;
          recorded_on: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          startup_id?: string;
          month?: string;
          cash_balance?: number;
          monthly_burn?: number;
          monthly_revenue?: number;
          customer_conversations?: number;
          pilots?: number;
          lois?: number;
          paying_customers?: number;
          team_full_time?: number;
          team_part_time?: number;
          key_learnings?: string | null;
          source?: string;
          recorded_on?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      health_assessments: {
        Row: {
          id: string;
          startup_id: string;
          month: string;
          profile: string;
          dimensions: Json;
          total: number;
          band: string;
          delta_3m: number | null;
          strengths: string;
          concerns: string;
          actions: Json;
          status: string;
          prepared_by: string;
          submitted_on: string | null;
          approved_by: string | null;
          approved_on: string | null;
          return_comment: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          startup_id: string;
          month: string;
          profile: string;
          dimensions: Json;
          total?: number;
          band: string;
          delta_3m?: number | null;
          strengths?: string;
          concerns?: string;
          actions?: Json;
          status?: string;
          prepared_by: string;
          submitted_on?: string | null;
          approved_by?: string | null;
          approved_on?: string | null;
          return_comment?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          startup_id?: string;
          month?: string;
          profile?: string;
          dimensions?: Json;
          total?: number;
          band?: string;
          delta_3m?: number | null;
          strengths?: string;
          concerns?: string;
          actions?: Json;
          status?: string;
          prepared_by?: string;
          submitted_on?: string | null;
          approved_by?: string | null;
          approved_on?: string | null;
          return_comment?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      data_requests: {
        Row: {
          id: string;
          startup_id: string;
          type: string;
          title: string;
          message: string | null;
          custom_questions: Json | null;
          milestone_ids: string[] | null;
          month: string | null;
          due_date: string;
          created_by: string;
          created_on: string;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          startup_id: string;
          type: string;
          title: string;
          message?: string | null;
          custom_questions?: Json | null;
          milestone_ids?: string[] | null;
          month?: string | null;
          due_date: string;
          created_by: string;
          created_on: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          startup_id?: string;
          type?: string;
          title?: string;
          message?: string | null;
          custom_questions?: Json | null;
          milestone_ids?: string[] | null;
          month?: string | null;
          due_date?: string;
          created_by?: string;
          created_on?: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      founder_submissions: {
        Row: {
          id: string;
          request_id: string | null;
          startup_id: string;
          submitted_on: string;
          payload: Json;
          status: string;
          reviewed_by: string | null;
          reviewed_on: string | null;
          review_comment: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          request_id?: string | null;
          startup_id: string;
          submitted_on: string;
          payload?: Json;
          status?: string;
          reviewed_by?: string | null;
          reviewed_on?: string | null;
          review_comment?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          request_id?: string | null;
          startup_id?: string;
          submitted_on?: string;
          payload?: Json;
          status?: string;
          reviewed_by?: string | null;
          reviewed_on?: string | null;
          review_comment?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      mentors: {
        Row: {
          id: string;
          name: string;
          title: string;
          phone: string | null;
          linkedin: string | null;
          sectors: string[];
          expertise: string[];
          stages: string[];
          geography: string;
          availability: string;
          max_active_matches: number;
          bio: string;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          title: string;
          phone?: string | null;
          linkedin?: string | null;
          sectors?: string[];
          expertise?: string[];
          stages?: string[];
          geography?: string;
          availability?: string;
          max_active_matches?: number;
          bio?: string;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          title?: string;
          phone?: string | null;
          linkedin?: string | null;
          sectors?: string[];
          expertise?: string[];
          stages?: string[];
          geography?: string;
          availability?: string;
          max_active_matches?: number;
          bio?: string;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      mentor_requests: {
        Row: {
          id: string;
          startup_id: string;
          challenge: string;
          expertise_needed: string[];
          raised_by: string;
          created_on: string;
          ranked: Json | null;
          recommended_mentor_id: string | null;
          status: string;
          mentor_id: string | null;
          note: string | null;
          fitt_task_n: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          startup_id: string;
          challenge: string;
          expertise_needed?: string[];
          raised_by?: string;
          created_on: string;
          ranked?: Json | null;
          recommended_mentor_id?: string | null;
          status?: string;
          mentor_id?: string | null;
          note?: string | null;
          fitt_task_n?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          startup_id?: string;
          challenge?: string;
          expertise_needed?: string[];
          raised_by?: string;
          created_on?: string;
          ranked?: Json | null;
          recommended_mentor_id?: string | null;
          status?: string;
          mentor_id?: string | null;
          note?: string | null;
          fitt_task_n?: number | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      mentor_matches: {
        Row: {
          id: string;
          request_id: string | null;
          startup_id: string;
          mentor_id: string;
          confirmed_by: string;
          confirmed_on: string;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          request_id?: string | null;
          startup_id: string;
          mentor_id: string;
          confirmed_by: string;
          confirmed_on: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          request_id?: string | null;
          startup_id?: string;
          mentor_id?: string;
          confirmed_by?: string;
          confirmed_on?: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      mentor_sessions: {
        Row: {
          id: string;
          match_id: string;
          date: string;
          topic: string;
          next_step: string;
          rating: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          match_id: string;
          date: string;
          topic: string;
          next_step?: string;
          rating?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          match_id?: string;
          date?: string;
          topic?: string;
          next_step?: string;
          rating?: number | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      founder_action_items: {
        Row: {
          id: string;
          startup_id: string;
          title: string;
          cause: string;
          effect: string;
          fix: string;
          note: string | null;
          shared_by: string;
          shared_on: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          startup_id: string;
          title: string;
          cause: string;
          effect: string;
          fix: string;
          note?: string | null;
          shared_by: string;
          shared_on: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          startup_id?: string;
          title?: string;
          cause?: string;
          effect?: string;
          fix?: string;
          note?: string | null;
          shared_by?: string;
          shared_on?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      activity_logs: {
        Row: {
          id: string;
          startup_id: string;
          at: string;
          actor: string;
          text: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          startup_id: string;
          at?: string;
          actor: string;
          text: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          startup_id?: string;
          at?: string;
          actor?: string;
          text?: string;
          created_at?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          title: string;
          message: string;
          type: string;
          startup_id: string | null;
          startup_name: string | null;
          target_role: string | null;
          target_user_id: string | null;
          action_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          message: string;
          type: string;
          startup_id?: string | null;
          startup_name?: string | null;
          target_role?: string | null;
          target_user_id?: string | null;
          action_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          message?: string;
          type?: string;
          startup_id?: string | null;
          startup_name?: string | null;
          target_role?: string | null;
          target_user_id?: string | null;
          action_url?: string | null;
          created_at?: string;
        };
      };
      notification_recipients: {
        Row: {
          id: string;
          notification_id: string;
          recipient_id: string;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          notification_id: string;
          recipient_id: string;
          read_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          notification_id?: string;
          recipient_id?: string;
          read_at?: string | null;
          created_at?: string;
        };
      };
      regulatory_items: {
        Row: {
          id: string;
          title: string;
          authority: string;
          kind: string;
          status: string;
          published_on: string;
          consultation_closes_on: string | null;
          effective_on: string | null;
          summary: string;
          sectors: string[];
          direct_tags: string[];
          indirect_tags: string[];
          what_to_check: string[];
          is_sample: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          authority: string;
          kind: string;
          status: string;
          published_on: string;
          consultation_closes_on?: string | null;
          effective_on?: string | null;
          summary: string;
          sectors?: string[];
          direct_tags?: string[];
          indirect_tags?: string[];
          what_to_check?: string[];
          is_sample?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          authority?: string;
          kind?: string;
          status?: string;
          published_on?: string;
          consultation_closes_on?: string | null;
          effective_on?: string | null;
          summary?: string;
          sectors?: string[];
          direct_tags?: string[];
          indirect_tags?: string[];
          what_to_check?: string[];
          is_sample?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Functions: {
      get_current_role: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      can_access_startup: {
        Args: {
          p_startup_id: string;
        };
        Returns: boolean;
      };
      update_assignment: {
        Args: {
          p_startup_id: string;
          p_manager_id: string | null;
          p_associate_id: string | null;
        };
        Returns: void;
      };
      approve_assessment: {
        Args: {
          p_assessment_id: string;
        };
        Returns: void;
      };
    };
  };
}
