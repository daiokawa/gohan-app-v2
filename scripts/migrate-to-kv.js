require('dotenv').config({ path: '.env.production' });
const fs = require('fs');
const path = require('path');
const { Redis } = require('@upstash/redis');

// Upstash KV接続
const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

async function migrateData() {
  try {
    console.log('🚀 Starting migration to Upstash KV...\n');

    // ローカルJSONファイルから読み込み
    const dataPath = path.join(__dirname, '..', 'data', 'restaurants.json');
    const restaurants = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

    console.log(`📊 Found ${restaurants.length} restaurants in local JSON`);

    // Upstash KVに保存
    await redis.set('restaurants', restaurants);

    console.log('✅ Data migrated to Upstash KV successfully!');

    // 確認
    const stored = await redis.get('restaurants');
    console.log(`\n✅ Verification: ${Array.isArray(stored) ? stored.length : 'unknown'} restaurants in KV`);

    // 最初の3件を表示
    console.log('\n📝 First 3 restaurants:');
    if (Array.isArray(stored)) {
      stored.slice(0, 3).forEach(r => {
        console.log(`  - ${r.name}`);
      });
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrateData();
