#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Supabase設定
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase環境変数が設定されていません');
  console.log('以下の手順で設定してください：');
  console.log('1. Supabaseプロジェクトにアクセス');
  console.log('2. Settings > API から URL と anon key をコピー');
  console.log('3. .env.local ファイルに設定');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function migrate() {
  console.log('🚀 Supabaseへのデータ移行を開始します...\n');

  // 既存のJSONデータを読み込み
  const dataPath = path.join(__dirname, '..', 'data', 'restaurants.json');
  
  if (!fs.existsSync(dataPath)) {
    console.error('❌ data/restaurants.json が見つかりません');
    process.exit(1);
  }

  const jsonData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  console.log(`📊 ${jsonData.length}件のレストランデータを検出\n`);

  // 既存データをクリア（オプション）
  const clearExisting = process.argv.includes('--clear');
  if (clearExisting) {
    console.log('🗑️  既存データをクリア中...');
    const { error: deleteError } = await supabase
      .from('restaurants')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // すべて削除
    
    if (deleteError) {
      console.error('❌ データクリアエラー:', deleteError);
      process.exit(1);
    }
    console.log('✅ 既存データをクリアしました\n');
  }

  // データを整形して挿入
  const supabaseData = jsonData.map(restaurant => ({
    name: restaurant.name,
    google_maps_url: restaurant.googleMapsUrl || null,
    address: restaurant.address || null,
    category: restaurant.category || null,
    business_hours: restaurant.businessHours || {},
    coordinates: restaurant.coordinates || null
  }));

  // バッチで挿入
  console.log('📤 データをSupabaseに挿入中...');
  const { data, error } = await supabase
    .from('restaurants')
    .insert(supabaseData)
    .select();

  if (error) {
    console.error('❌ 挿入エラー:', error);
    process.exit(1);
  }

  console.log(`✅ ${data.length}件のレストランをSupabaseに移行しました！\n`);
  
  // 結果を表示
  console.log('📋 移行されたレストラン:');
  data.forEach((r, i) => {
    console.log(`  ${i + 1}. ${r.name}`);
  });

  console.log('\n🎉 移行が完了しました！');
  console.log('次のステップ:');
  console.log('1. Supabaseダッシュボードでデータを確認');
  console.log('2. Vercelに環境変数を設定');
  console.log('3. 本番環境にデプロイ');
}

// 実行
migrate().catch(console.error);