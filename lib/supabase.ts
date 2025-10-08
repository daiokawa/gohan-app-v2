import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Supabaseが設定されているかチェック
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

// Supabaseクライアントの作成（設定されている場合のみ）
export const supabase = isSupabaseConfigured && supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// レストラン型定義（Supabase用）
export interface SupabaseRestaurant {
  id: string;
  name: string;
  google_maps_url?: string | null;
  address?: string | null;
  category?: string | null;
  business_hours?: any;
  coordinates?: {
    lat: number;
    lng: number;
  } | null;
  created_at?: string;
  updated_at?: string;
}