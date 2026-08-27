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
      bids: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          url: string;
          amount: number;
          status: 'pending' | 'paid' | 'failed' | 'refunded' | 'disputed';
          category: string;
          title: string | null;
          description: string | null;
          icon_url: string | null;
          click_count: number;
          view_count: number;
          stripe_payment_intent_id: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          url: string;
          amount: number;
          status?: 'pending' | 'paid' | 'failed' | 'refunded' | 'disputed';
          category?: string;
          title?: string | null;
          description?: string | null;
          icon_url?: string | null;
          click_count?: number;
          view_count?: number;
          stripe_payment_intent_id?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          url?: string;
          amount?: number;
          status?: 'pending' | 'paid' | 'failed' | 'refunded' | 'disputed';
          category?: string;
          title?: string | null;
          description?: string | null;
          icon_url?: string | null;
          click_count?: number;
          view_count?: number;
          stripe_payment_intent_id?: string | null;
        };
        Relationships: [];
      };
      admin_settings: {
        Row: {
          id: string;
          password_hash: string;
          salt: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          password_hash: string;
          salt: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          password_hash?: string;
          salt?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      analytics_events: {
        Row: {
          id: string;
          created_at: string;
          bid_id: string;
          event_type: string;
          ip_hash: string;
        };
        Insert: {
          id?: string;
          created_at?: string;
          bid_id: string;
          event_type?: string;
          ip_hash: string;
        };
        Update: {
          id?: string;
          created_at?: string;
          bid_id?: string;
          event_type?: string;
          ip_hash?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'analytics_events_bid_id_fkey';
            columns: ['bid_id'];
            referencedRelation: 'bids';
            referencedColumns: ['id'];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
