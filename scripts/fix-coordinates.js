#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');

// Supabase設定
const supabaseUrl = 'https://vauetbbdowdmrhrrzsfj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZhdWV0YmJkb3dkbXJocnJ6c2ZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY4MjMwNTMsImV4cCI6MjA3MjM5OTA1M30.hydr7vDC3Wj4JGmaciuzfFPLhglmX5WJTSSdPMQrlq8';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Google Maps URLから座標を取得する関数
async function getCoordinatesFromGoogleMapsUrl(url) {
  if (!url) return null;
  
  try {
    // URLをデコード
    const decodedUrl = decodeURIComponent(url);
    
    // Place APIを使って場所を検索
    const searchQuery = decodedUrl.match(/[?&]q=([^&]+)/)?.[1];
    if (!searchQuery) return null;
    
    // 国土地理院APIで住所から座標を取得
    const gsiUrl = `https://msearch.gsi.go.jp/address-search/AddressSearch?q=${encodeURIComponent(searchQuery)}`;
    const response = await fetch(gsiUrl);
    
    if (response.ok) {
      const data = await response.json();
      if (data && data.length > 0) {
        const coordinates = data[0].geometry?.coordinates;
        if (coordinates && coordinates.length >= 2) {
          // 福岡県内の座標範囲チェック
          const lat = coordinates[1];
          const lng = coordinates[0];
          if (lat >= 33 && lat <= 34 && lng >= 130 && lng <= 131) {
            return {
              lat: lat,
              lng: lng
            };
          }
        }
      }
    }
    
    // 国土地理院APIで見つからない場合、住所を整形して再試行
    const addressMatch = searchQuery.match(/〒?\d{3}-?\d{4}\s*(.+)/);
    if (addressMatch) {
      const cleanAddress = addressMatch[1].replace(/\s+/g, '');
      const gsiUrl2 = `https://msearch.gsi.go.jp/address-search/AddressSearch?q=${encodeURIComponent(cleanAddress)}`;
      const response2 = await fetch(gsiUrl2);
      
      if (response2.ok) {
        const data2 = await response2.json();
        if (data2 && data2.length > 0) {
          const coordinates = data2[0].geometry?.coordinates;
          if (coordinates && coordinates.length >= 2) {
            return {
              lat: coordinates[1],
              lng: coordinates[0]
            };
          }
        }
      }
    }
    
  } catch (error) {
    console.error('Error parsing Google Maps URL:', error);
  }
  
  return null;
}

// より正確な座標取得（Google Places API風の処理）
async function getAccurateCoordinates(name, address) {
  if (!address) return null;
  
  try {
    // 福岡県北九州市を強制的に付ける
    let searchAddress = address;
    if (!address.includes('福岡県')) {
      searchAddress = '福岡県北九州市小倉北区 ' + address.replace(/〒\d{3}-\d{4}\s*/, '');
    }
    
    // まず完全な住所で検索
    const fullQuery = `${searchAddress}`;
    const gsiUrl = `https://msearch.gsi.go.jp/address-search/AddressSearch?q=${encodeURIComponent(fullQuery)}`;
    const response = await fetch(gsiUrl);
    
    if (response.ok) {
      const data = await response.json();
      if (data && data.length > 0) {
        const coordinates = data[0].geometry?.coordinates;
        if (coordinates && coordinates.length >= 2) {
          // 福岡県内の座標範囲チェック（緯度33-34、経度130-131）
          const lat = coordinates[1];
          const lng = coordinates[0];
          if (lat >= 33 && lat <= 34 && lng >= 130 && lng <= 131) {
            return {
              lat: lat,
              lng: lng
            };
          }
        }
      }
    }
    
    // 住所のみで再試行
    const cleanAddress = address.replace(/〒\d{3}-\d{4}\s*/, '');
    const gsiUrl2 = `https://msearch.gsi.go.jp/address-search/AddressSearch?q=${encodeURIComponent('福岡県北九州市小倉北区' + cleanAddress)}`;
    const response2 = await fetch(gsiUrl2);
    
    if (response2.ok) {
      const data2 = await response2.json();
      if (data2 && data2.length > 0) {
        const coordinates = data2[0].geometry?.coordinates;
        if (coordinates && coordinates.length >= 2) {
          // 福岡県内の座標範囲チェック
          const lat = coordinates[1];
          const lng = coordinates[0];
          if (lat >= 33 && lat <= 34 && lng >= 130 && lng <= 131) {
            return {
              lat: lat,
              lng: lng
            };
          }
        }
      }
    }
    
  } catch (error) {
    console.error('Error getting coordinates:', error);
  }
  
  return null;
}

async function fixAllCoordinates() {
  console.log('🔍 全店舗の座標を修正中...\n');
  
  // 全店舗を取得
  const { data: restaurants, error } = await supabase
    .from('restaurants')
    .select('*')
    .order('name');
  
  if (error) {
    console.error('Error fetching restaurants:', error);
    return;
  }
  
  console.log(`📍 ${restaurants.length}件の店舗を処理します\n`);
  
  let fixed = 0;
  let failed = 0;
  let skipped = 0;
  
  for (const restaurant of restaurants) {
    process.stdout.write(`\r処理中: ${fixed + failed + skipped + 1}/${restaurants.length} - ${restaurant.name}`);
    
    // まずGoogle Maps URLから座標を取得
    let newCoordinates = await getCoordinatesFromGoogleMapsUrl(restaurant.google_maps_url);
    
    // Google Maps URLから取得できない場合、住所から取得
    if (!newCoordinates) {
      newCoordinates = await getAccurateCoordinates(restaurant.name, restaurant.address);
    }
    
    if (newCoordinates) {
      // 座標が変更された場合のみ更新
      const currentLat = restaurant.coordinates?.lat;
      const currentLng = restaurant.coordinates?.lng;
      
      if (currentLat !== newCoordinates.lat || currentLng !== newCoordinates.lng) {
        const { error: updateError } = await supabase
          .from('restaurants')
          .update({ coordinates: newCoordinates })
          .eq('id', restaurant.id);
        
        if (updateError) {
          console.error(`\n❌ ${restaurant.name}: 更新失敗`, updateError);
          failed++;
        } else {
          console.log(`\n✅ ${restaurant.name}: 座標更新 (${newCoordinates.lat}, ${newCoordinates.lng})`);
          fixed++;
        }
      } else {
        skipped++;
      }
    } else {
      console.log(`\n⚠️ ${restaurant.name}: 座標を取得できませんでした`);
      failed++;
    }
    
    // APIレート制限を避けるため少し待機
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\n\n🎉 座標修正完了！');
  console.log(`✅ 更新: ${fixed}件`);
  console.log(`⏭️ スキップ: ${skipped}件`);
  console.log(`❌ 失敗: ${failed}件`);
}

// 実行
fixAllCoordinates().catch(console.error);