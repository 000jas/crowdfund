import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables:', {
    url: supabaseUrl ? 'present' : 'missing',
    key: supabaseAnonKey ? 'present' : 'missing'
  });
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          wallet_address: string | null;
          username: string | null;
          avatar_url: string | null;
          is_verified: boolean;
          referral_code: string;
          referred_by: string | null;
          total_donated: number;
          total_raised: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          wallet_address?: string | null;
          username?: string | null;
          avatar_url?: string | null;
          is_verified?: boolean;
          referral_code: string;
          referred_by?: string | null;
          total_donated?: number;
          total_raised?: number;
        };
        Update: {
          wallet_address?: string | null;
          username?: string | null;
          avatar_url?: string | null;
          is_verified?: boolean;
          total_donated?: number;
          total_raised?: number;
          updated_at?: string;
        };
      };
      campaigns: {
        Row: {
          id: string;
          creator_id: string;
          title: string;
          description: string;
          funding_goal: number;
          current_funding: number;
          deadline: string;
          category: string;
          image_ipfs_hash: string | null;
          media_ipfs_hashes: string[];
          is_active: boolean;
          contract_address: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          creator_id: string;
          title: string;
          description: string;
          funding_goal: number;
          current_funding?: number;
          deadline: string;
          category: string;
          image_ipfs_hash?: string | null;
          media_ipfs_hashes?: string[];
          is_active?: boolean;
          contract_address?: string | null;
        };
        Update: {
          current_funding?: number;
          is_active?: boolean;
          contract_address?: string | null;
          updated_at?: string;
        };
      };
      milestones: {
        Row: {
          id: string;
          campaign_id: string;
          title: string;
          description: string;
          funding_amount: number;
          is_completed: boolean;
          voting_deadline: string;
          votes_for: number;
          votes_against: number;
          total_voters: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          campaign_id: string;
          title: string;
          description: string;
          funding_amount: number;
          voting_deadline: string;
          is_completed?: boolean;
          votes_for?: number;
          votes_against?: number;
          total_voters?: number;
        };
        Update: {
          is_completed?: boolean;
          votes_for?: number;
          votes_against?: number;
          total_voters?: number;
        };
      };
      contributions: {
        Row: {
          id: string;
          contributor_id: string;
          campaign_id: string;
          amount: number;
          transaction_hash: string;
          referral_code: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          contributor_id: string;
          campaign_id: string;
          amount: number;
          transaction_hash: string;
          referral_code?: string | null;
        };
      };
      votes: {
        Row: {
          id: string;
          voter_id: string;
          milestone_id: string;
          vote: 'for' | 'against';
          transaction_hash: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          voter_id: string;
          milestone_id: string;
          vote: 'for' | 'against';
          transaction_hash: string;
        };
      };
      referral_rewards: {
        Row: {
          id: string;
          referrer_id: string;
          referred_id: string;
          contribution_id: string;
          reward_amount: number;
          reward_type: 'token' | 'nft';
          transaction_hash: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          referrer_id: string;
          referred_id: string;
          contribution_id: string;
          reward_amount: number;
          reward_type: 'token' | 'nft';
          transaction_hash: string;
        };
      };
    };
  };
}