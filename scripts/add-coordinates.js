const fs = require('fs');
const path = require('path');

// GSI APIを使って住所から座標を取得
async function fetchCoordinates(address) {
  if (!address) return null;
  
  try {
    const url = `https://msearch.gsi.go.jp/address-search/AddressSearch?q=${encodeURIComponent(address)}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error(`Failed to fetch coordinates for: ${address}`);
      return null;
    }
    
    const data = await response.json();
    
    if (data && data.length > 0 && data[0].geometry && data[0].geometry.coordinates) {
      const [lng, lat] = data[0].geometry.coordinates;
      return { lat, lng };
    }
    
    return null;
  } catch (error) {
    console.error(`Error fetching coordinates for ${address}:`, error);
    return null;
  }
}

// 遅延を追加（API制限対策）
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function addCoordinatesToRestaurants() {
  const dataFile = path.join(__dirname, '..', 'data', 'restaurants.json');
  
  // 現在のデータを読み込み
  const restaurants = JSON.parse(fs.readFileSync(dataFile, 'utf-8'));
  
  console.log(`📍 ${restaurants.length}件のレストランの座標を取得開始...`);
  
  let updated = 0;
  let skipped = 0;
  let failed = 0;
  
  for (let i = 0; i < restaurants.length; i++) {
    const restaurant = restaurants[i];
    
    // すでに座標がある場合はスキップ
    if (restaurant.coordinates && restaurant.coordinates.lat && restaurant.coordinates.lng) {
      console.log(`✓ ${restaurant.name} - 座標済み`);
      skipped++;
      continue;
    }
    
    // 住所から座標を取得
    if (restaurant.address) {
      console.log(`🔍 ${restaurant.name} - 座標取得中...`);
      const coords = await fetchCoordinates(restaurant.address);
      
      if (coords) {
        restaurant.coordinates = coords;
        console.log(`✅ ${restaurant.name} - 座標取得成功: ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`);
        updated++;
      } else {
        console.log(`❌ ${restaurant.name} - 座標取得失敗`);
        failed++;
      }
      
      // API制限対策: 0.5秒待機
      await delay(500);
    } else {
      console.log(`⚠️ ${restaurant.name} - 住所なし`);
      failed++;
    }
  }
  
  // データを保存
  fs.writeFileSync(dataFile, JSON.stringify(restaurants, null, 2));
  
  console.log('\n📊 座標追加完了:');
  console.log(`  ✅ 更新: ${updated}件`);
  console.log(`  ⏭️ スキップ: ${skipped}件`);
  console.log(`  ❌ 失敗: ${failed}件`);
  console.log(`  📍 合計: ${restaurants.length}件`);
}

// 実行
addCoordinatesToRestaurants().catch(console.error);