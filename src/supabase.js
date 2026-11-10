
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error(
    'Supabaseの接続情報が設定されていません。.envを確認してください。'
  );
}

export const supabase = createClient(
  supabaseUrl,
  supabasePublishableKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: "character-library-auth",
    },
  }
);

export async function testSupabaseConnection() {
  const { data, error } = await supabase
    .from('members')
    .select('user_id')
    .limit(1);

  if (error) {
    console.error('Supabase接続テスト失敗:', error.message);
    return false;
  }

  console.log('Supabase接続テスト成功:', data);
  return true;
}