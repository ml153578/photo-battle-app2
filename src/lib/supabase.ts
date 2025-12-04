import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

export type Database = {
  public: {
    Tables: {
      lobbies: {
        Row: {
          id: string;
          code: string;
          status: string;
          current_topic: string | null;
          current_round: number;
          host_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          status?: string;
          current_topic?: string | null;
          current_round?: number;
          host_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          code?: string;
          status?: string;
          current_topic?: string | null;
          current_round?: number;
          host_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      players: {
        Row: {
          id: string;
          lobby_id: string;
          nickname: string;
          image_url: string | null;
          is_ready: boolean;
          is_host: boolean;
          total_score: number;
          joined_at: string;
        };
        Insert: {
          id?: string;
          lobby_id: string;
          nickname: string;
          image_url?: string | null;
          is_ready?: boolean;
          is_host?: boolean;
          total_score?: number;
          joined_at?: string;
        };
        Update: {
          id?: string;
          lobby_id?: string;
          nickname?: string;
          image_url?: string | null;
          is_ready?: boolean;
          is_host?: boolean;
          total_score?: number;
          joined_at?: string;
        };
      };
      rounds: {
        Row: {
          id: string;
          lobby_id: string;
          round_number: number;
          topic: string;
          rankings_json: unknown | null;
          completed_at: string;
        };
        Insert: {
          id?: string;
          lobby_id: string;
          round_number: number;
          topic: string;
          rankings_json?: unknown | null;
          completed_at?: string;
        };
        Update: {
          id?: string;
          lobby_id?: string;
          round_number?: number;
          topic?: string;
          rankings_json?: unknown | null;
          completed_at?: string;
        };
      };
    };
  };
};
