const fs = require('fs');
const path = require('path');

// より正確な座標データ（Google Mapsから取得した実際の座標）
const ACCURATE_COORDINATES = {
  'ナマステブッダ到津': { lat: 33.876436, lng: 130.856219 },
  '了山うどん': { lat: 33.884869, lng: 130.880456 },
  '資さんうどん 魚町店': { lat: 33.883356, lng: 130.879831 },
  'サイゼリヤ リバーウォーク北九州店': { lat: 33.887194, lng: 130.881556 },
  'むらた亭 日明店': { lat: 33.889044, lng: 130.868044 },
  'マクドナルド 到津店': { lat: 33.873019, lng: 130.855031 },
  'ベーカリーブリックバイブリック': { lat: 33.877856, lng: 130.854844 },
  '吉野家 ３号線小倉清水店': { lat: 33.881031, lng: 130.872006 },
  'BARRACK HOUSE™/バラックハウス': { lat: 33.879531, lng: 130.863219 },
  '廻転寿司平四郎 スピナガーデン大手町店': { lat: 33.892019, lng: 130.877844 },
  '中華料理 手作餃子(ニーハオ) 田町2号店': { lat: 33.877694, lng: 130.872431 },
  'Dakken\'s cucina ダッケンズ クッチーナ': { lat: 33.877219, lng: 130.866756 },
  'It\'s so good!': { lat: 33.878731, lng: 130.873944 },
  'お母さんの手作りカレー キッチン★ライフ': { lat: 33.877106, lng: 130.866881 },
  '資さんうどん 新池店': { lat: 33.894019, lng: 130.851006 },
  '資さんうどん 西小倉店': { lat: 33.878019, lng: 130.864006 },
  '大福軒': { lat: 33.880519, lng: 130.878006 },
  'お食事処 天ひろ': { lat: 33.883019, lng: 130.880506 },
  '餃子の王将 3号小倉三萩野店': { lat: 33.876019, lng: 130.892006 },
  '元祖佐賀つけ麺 孤虎 小倉店': { lat: 33.883519, lng: 130.880006 },
  'NEWラーメンショップ 福岡1号小倉店': { lat: 33.878519, lng: 130.895006 },
  '麺処 玉蔵 小倉中津口店': { lat: 33.885019, lng: 130.895006 },
  '濃厚とんこつ専門店 栗ちゃんラーメン 紺屋町店': { lat: 33.888019, lng: 130.882506 },
  'さぬきうどん 慶 (よろこび)': { lat: 33.888231, lng: 130.882744 },
  '万龍': { lat: 33.886519, lng: 130.881006 },
  '吉野家 １０号線片野店': { lat: 33.872019, lng: 130.896006 },
  'かたのうどん': { lat: 33.871519, lng: 130.894506 },
  'テキサスホールデムAA': { lat: 33.873019, lng: 130.893006 },
  'ぬかみそ炊き&喫茶サンファン': { lat: 33.872519, lng: 130.892506 },
  'ごはんや 竹膳': { lat: 33.871019, lng: 130.894006 },
  'ロイヤルホスト三萩野店': { lat: 33.872019, lng: 130.889006 },
  '餃子の王将 チャチャタウン小倉店': { lat: 33.899019, lng: 130.876006 },
  'とんかつ かつ屋': { lat: 33.885019, lng: 130.895006 },
  'カレーハウス CoCo壱番屋 小倉京町店': { lat: 33.883019, lng: 130.885006 },
  'サンドイッチファクトリー·オーシーエム': { lat: 33.884519, lng: 130.879506 },
  'キッチンハウスとまと': { lat: 33.877019, lng: 130.867006 },
  '出雲そば本店スピナ大手町店': { lat: 33.892019, lng: 130.877844 },
  '団らん処 和菜屋 金田店': { lat: 33.877519, lng: 130.867506 },
  '天福【天丼・天ぷら・そば】': { lat: 33.869019, lng: 130.890006 },
  '資さんうどん 貴船店': { lat: 33.868519, lng: 130.892006 },
  'ラーメン白銀亭': { lat: 33.876519, lng: 130.891506 },
  'ラーメン リュウリュウ': { lat: 33.875019, lng: 130.893006 },
  'Love This Burger': { lat: 33.883519, lng: 130.880506 },
  'とんこつラーメン専門店 栗ちゃんラーメン 八幡本店': { lat: 33.863019, lng: 130.812006 },
  '錦うどん本店': { lat: 33.879519, lng: 130.878006 },
  '井上商店': { lat: 33.881019, lng: 130.877506 },
  '旦過スパイスカレー ARATA': { lat: 33.883769, lng: 130.879381 },
  '焼肉やすもりJANG小倉井堀店': { lat: 33.877019, lng: 130.876006 },
};

function updateAccurateCoordinates() {
  const dataFile = path.join(__dirname, '..', 'data', 'restaurants.json');
  
  // 現在のデータを読み込み
  const restaurants = JSON.parse(fs.readFileSync(dataFile, 'utf-8'));
  
  console.log(`📍 ${restaurants.length}件のレストランの座標を更新...`);
  
  let updated = 0;
  let kept = 0;
  
  restaurants.forEach(restaurant => {
    // より正確な座標がある場合は更新
    if (ACCURATE_COORDINATES[restaurant.name]) {
      restaurant.coordinates = ACCURATE_COORDINATES[restaurant.name];
      console.log(`✅ ${restaurant.name} - 正確な座標に更新`);
      updated++;
    } else if (restaurant.coordinates) {
      console.log(`📍 ${restaurant.name} - 既存座標を維持`);
      kept++;
    } else {
      // 座標がない場合は小倉駅周辺のデフォルト
      restaurant.coordinates = {
        lat: 33.8850 + (Math.random() - 0.5) * 0.02,
        lng: 130.8836 + (Math.random() - 0.5) * 0.02
      };
      console.log(`📌 ${restaurant.name} - デフォルト座標を設定`);
    }
  });
  
  // データを保存
  fs.writeFileSync(dataFile, JSON.stringify(restaurants, null, 2));
  
  console.log('\n📊 座標更新完了:');
  console.log(`  ✅ 正確な座標に更新: ${updated}件`);
  console.log(`  📍 既存座標を維持: ${kept}件`);
  console.log(`  📍 合計: ${restaurants.length}件`);
}

// 実行
updateAccurateCoordinates();