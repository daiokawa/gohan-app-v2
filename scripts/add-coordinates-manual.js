const fs = require('fs');
const path = require('path');

// 主要な店舗の座標を手動で設定（小倉周辺）
const KNOWN_COORDINATES = {
  'ナマステブッダ到津': { lat: 33.8764, lng: 130.8562 },
  '了山うどん': { lat: 33.8849, lng: 130.8805 },
  '資さんうどん 魚町店': { lat: 33.8834, lng: 130.8798 },
  'サイゼリヤ リバーウォーク北九州店': { lat: 33.8872, lng: 130.8816 },
  'むらた亭 日明店': { lat: 33.8890, lng: 130.8680 },
  'マクドナルド 到津店': { lat: 33.8730, lng: 130.8550 },
  '吉野家 ３号線小倉清水店': { lat: 33.8810, lng: 130.8720 },
  '廻転寿司平四郎 スピナガーデン大手町店': { lat: 33.8920, lng: 130.8780 },
  '餃子の王将 3号小倉三萩野店': { lat: 33.8760, lng: 130.8920 },
  '餃子の王将 チャチャタウン小倉店': { lat: 33.8990, lng: 130.8760 },
  '資さんうどん 新池店': { lat: 33.8940, lng: 130.8510 },
  '資さんうどん 西小倉店': { lat: 33.8780, lng: 130.8640 },
  'とんかつ かつ屋': { lat: 33.8850, lng: 130.8950 },
  'カレーハウス CoCo壱番屋 小倉京町店': { lat: 33.8830, lng: 130.8850 },
  'ロイヤルホスト三萩野店': { lat: 33.8720, lng: 130.8890 },
};

// 小倉駅周辺のデフォルト座標（座標が取得できない場合）
const DEFAULT_KOKURA = { lat: 33.8850, lng: 130.8836 };

function addManualCoordinates() {
  const dataFile = path.join(__dirname, '..', 'data', 'restaurants.json');
  
  // 現在のデータを読み込み
  const restaurants = JSON.parse(fs.readFileSync(dataFile, 'utf-8'));
  
  console.log(`📍 ${restaurants.length}件のレストランに座標を設定...`);
  
  let updated = 0;
  let skipped = 0;
  let defaulted = 0;
  
  restaurants.forEach(restaurant => {
    // すでに座標がある場合はスキップ
    if (restaurant.coordinates && restaurant.coordinates.lat && restaurant.coordinates.lng) {
      console.log(`✓ ${restaurant.name} - 座標済み`);
      skipped++;
      return;
    }
    
    // 既知の座標を設定
    if (KNOWN_COORDINATES[restaurant.name]) {
      restaurant.coordinates = KNOWN_COORDINATES[restaurant.name];
      console.log(`✅ ${restaurant.name} - 既知の座標を設定`);
      updated++;
    } else {
      // 住所から地域を推定して近い座標を設定
      const address = restaurant.address || '';
      let coords = { ...DEFAULT_KOKURA };
      
      // 地域ごとに微調整
      if (address.includes('戸畑')) {
        coords.lat += 0.01;  // 戸畑は少し北
        coords.lng -= 0.02;  // 西
      } else if (address.includes('到津')) {
        coords.lat -= 0.01;  // 到津は少し南
        coords.lng -= 0.02;  // 西
      } else if (address.includes('魚町')) {
        coords.lat -= 0.002; // 魚町は駅南
        coords.lng -= 0.003;
      } else if (address.includes('紺屋町')) {
        coords.lat += 0.003; // 紺屋町は駅北東
        coords.lng += 0.002;
      } else if (address.includes('片野')) {
        coords.lat -= 0.013; // 片野は南
        coords.lng += 0.01;  // 東
      } else if (address.includes('三萩野')) {
        coords.lat -= 0.01;  // 三萩野は南
        coords.lng += 0.008; // 東
      }
      
      // ランダムな微調整を加えて重ならないようにする
      coords.lat += (Math.random() - 0.5) * 0.005;
      coords.lng += (Math.random() - 0.5) * 0.005;
      
      restaurant.coordinates = coords;
      console.log(`📍 ${restaurant.name} - デフォルト座標を設定（${address ? '地域調整済み' : '小倉駅周辺'}）`);
      defaulted++;
    }
  });
  
  // データを保存
  fs.writeFileSync(dataFile, JSON.stringify(restaurants, null, 2));
  
  console.log('\n📊 座標設定完了:');
  console.log(`  ✅ 既知の座標: ${updated}件`);
  console.log(`  📍 推定座標: ${defaulted}件`);
  console.log(`  ⏭️ スキップ: ${skipped}件`);
  console.log(`  📍 合計: ${restaurants.length}件`);
}

// 実行
addManualCoordinates();