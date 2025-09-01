const fs = require('fs');
const path = require('path');

// 短縮する名前のマッピング
const NAME_MAPPINGS = {
  'BARRACK HOUSE™/バラックハウス': 'バラックハウス',
  '廻転寿司平四郎 スピナガーデン大手町店': '平四郎 大手町店',
  '中華料理 手作餃子(ニーハオ) 田町2号店': 'ニーハオ 田町2号店',
  "Dakken's cucina ダッケンズ クッチーナ": 'ダッケンズ',
  'お母さんの手作りカレー キッチン★ライフ': 'キッチン★ライフ',
  'NEWラーメンショップ 福岡1号小倉店': 'NEWラーメンショップ',
  '濃厚とんこつ専門店 栗ちゃんラーメン 紺屋町店': '栗ちゃんラーメン 紺屋町',
  'カレーハウス CoCo壱番屋 小倉京町店': 'CoCo壱番屋 京町店',
  'サンドイッチファクトリー·オーシーエム': 'サンドイッチファクトリー',
  'とんこつラーメン専門店 栗ちゃんラーメン 八幡本店': '栗ちゃんラーメン 八幡',
  'ベーカリーブリックバイブリック': 'ブリックバイブリック',
  'サイゼリヤ リバーウォーク北九州店': 'サイゼリヤ RW店',
};

function shortenNames() {
  const dataFile = path.join(__dirname, '..', 'data', 'restaurants.json');
  
  // 現在のデータを読み込み
  const restaurants = JSON.parse(fs.readFileSync(dataFile, 'utf-8'));
  
  console.log(`📝 ${restaurants.length}件のレストラン名を確認...`);
  
  let updated = 0;
  
  restaurants.forEach(restaurant => {
    // 短縮名がある場合は更新
    if (NAME_MAPPINGS[restaurant.name]) {
      const oldName = restaurant.name;
      restaurant.name = NAME_MAPPINGS[restaurant.name];
      console.log(`✅ ${oldName} → ${restaurant.name}`);
      updated++;
    }
  });
  
  // データを保存
  fs.writeFileSync(dataFile, JSON.stringify(restaurants, null, 2));
  
  console.log('\n📊 短縮完了:');
  console.log(`  ✅ 更新: ${updated}件`);
  console.log(`  📍 合計: ${restaurants.length}件`);
}

// 実行
shortenNames();