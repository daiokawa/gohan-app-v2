const fs = require('fs');
const path = require('path');

// Vercel KVから直接データを取得してバックアップ
async function backupRestaurants() {
  try {
    // Vercel KVから取得
    const response = await fetch('https://electric-alpaca-36984.upstash.io/get/restaurants', {
      headers: {
        'Authorization': 'Bearer AZB4AAIjcDEyNDRlN2VkYmU5YTE0MzViYWQ3NzQzZGNhOTMxMWNmMnAxMA'
      }
    });
    
    const data = await response.json();
    const restaurants = JSON.parse(data.result || '[]');
    
    // タイムスタンプ付きファイル名
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = `restaurants-backup-${timestamp}.json`;
    
    // 複数の場所に保存
    const backupDirs = [
      path.join(process.env.HOME, 'Documents', 'gohan-backups'),
      path.join(__dirname, '..', 'backups'),
      path.join(process.env.HOME, 'Desktop')
    ];
    
    for (const dir of backupDirs) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const filepath = path.join(dir, filename);
      fs.writeFileSync(filepath, JSON.stringify(restaurants, null, 2));
      console.log(`✅ Backed up to: ${filepath}`);
    }
    
    console.log(`\n📊 Total restaurants backed up: ${restaurants.length}`);
    
    // 最後の5件の店名を表示（確認用）
    console.log('\n最近追加された店舗:');
    restaurants.slice(-5).forEach(r => {
      console.log(`  - ${r.name}`);
    });
    
  } catch (error) {
    console.error('❌ Backup failed:', error);
  }
}

// 実行
backupRestaurants();