#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');

// Supabase設定
const supabaseUrl = 'https://vauetbbdowdmrhrrzsfj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZhdWV0YmJkb3dkbXJocnJ6c2ZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY4MjMwNTMsImV4cCI6MjA3MjM5OTA1M30.hydr7vDC3Wj4JGmaciuzfFPLhglmX5WJTSSdPMQrlq8';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 明らかに間違っている座標を持つ店舗をリセット
const wrongStores = [
  { name: 'さぬきうどん 慶 (よろこび)', lat: 33.875, lng: 130.875 },
  { name: 'ニーハオ 田町2号店', lat: 33.8845, lng: 130.8735 },
  { name: 'ロイヤルホスト三萩野店', lat: 33.872, lng: 130.889 },
  { name: '井上商店', lat: 33.88, lng: 130.88 },
  { name: '元祖佐賀つけ麺 孤虎 小倉店', lat: 33.88, lng: 130.88 },
  { name: '出雲そば本店スピナ大手町店', lat: 33.88, lng: 130.88 },
  { name: '吉野家 １０号線片野店', lat: 33.871, lng: 130.894 },
  { name: '吉野家 ３号線小倉清水店', lat: 33.88, lng: 130.88 },
  { name: '大福軒', lat: 33.88, lng: 130.88 },
  { name: '天福【天丼・天ぷら・そば】', lat: 33.869, lng: 130.890 },
  { name: '旦過スパイスカレー ARATA', lat: 33.884, lng: 130.878 },
  { name: '錦うどん本店', lat: 33.88, lng: 130.88 },
];

async function fixWrongCoordinates() {
  console.log('🚨 間違った座標を修正中...\n');
  
  for (const store of wrongStores) {
    const { data, error } = await supabase
      .from('restaurants')
      .update({ 
        coordinates: { 
          lat: store.lat, 
          lng: store.lng 
        } 
      })
      .eq('name', store.name);
    
    if (error) {
      console.error(`❌ ${store.name}: 更新失敗`, error);
    } else {
      console.log(`✅ ${store.name}: 座標修正 (${store.lat}, ${store.lng})`);
    }
  }
  
  console.log('\n✅ 修正完了！');
}

fixWrongCoordinates().catch(console.error);