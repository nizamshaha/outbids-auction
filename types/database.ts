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
          url: string;
          amount: number;
          status: 'pending' | 'paid' | 'failed';
          stripe_payment_intent_id: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          url: string;
          amount: number;
          status?: 'pending' | 'paid' | 'failed';
          stripe_payment_intent_id?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          url?: string;
          amount?: number;
          status?: 'pending' | 'paid' | 'failed';
          stripe_payment_intent_id?: string | null;
        };
        Relationships: [];
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
