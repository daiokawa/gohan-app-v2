const { Redis } = require('@upstash/redis');

const redis = new Redis({
  url: 'https://electric-alpaca-36984.upstash.io',
  token: 'AZB4AAIjcDEyNDRlN2VkYmU5YTE0MzViYWQ3NzQzZGNhOTMxMWNmMnAxMA',
});

const initialData = [
  {
    id: 'namaste-buddha',
    name: 'ナマステブッダ到津',
    address: '福岡県北九州市小倉北区下到津4-9-2',
    googleMapsUrl: 'https://maps.google.com/?q=ナマステブッダ到津',
    category: 'カレー',
    businessHours: {
      monday: [{ open: '11:30', close: '15:00' }, { open: '17:00', close: '22:00' }],
      tuesday: [{ open: '11:30', close: '15:00' }, { open: '17:00', close: '22:00' }],
      wednesday: [{ open: '11:30', close: '15:00' }, { open: '17:00', close: '22:00' }],
      thursday: [{ open: '11:30', close: '15:00' }, { open: '17:00', close: '22:00' }],
      friday: [{ open: '11:30', close: '15:00' }, { open: '17:00', close: '22:00' }],
      saturday: [{ open: '11:30', close: '22:00' }],
      sunday: [{ open: '11:30', close: '22:00' }],
    },
  },
  {
    id: 'ryozan-udon',
    name: '了山うどん',
    address: '福岡県北九州市小倉北区魚町',
    googleMapsUrl: 'https://maps.google.com/?q=了山うどん',
    category: 'うどん',
    businessHours: {
      monday: [{ open: '11:00', close: '19:00' }],
      tuesday: [{ open: '11:00', close: '19:00' }],
      wednesday: [{ open: '11:00', close: '19:00' }],
      thursday: [{ open: '11:00', close: '19:00' }],
      friday: [{ open: '11:00', close: '19:00' }],
      saturday: [{ open: '11:00', close: '19:00' }],
    },
  },
  {
    id: 'sukesanudon-uomachi',
    name: '資さんうどん 魚町店',
    address: '福岡県北九州市小倉北区魚町2-3-21',
    googleMapsUrl: 'https://maps.google.com/?q=資さんうどん魚町店',
    category: 'うどん',
    businessHours: {
      // 24時間営業
      monday: [{ open: '00:00', close: '23:59' }],
      tuesday: [{ open: '00:00', close: '23:59' }],
      wednesday: [{ open: '00:00', close: '23:59' }],
      thursday: [{ open: '00:00', close: '23:59' }],
      friday: [{ open: '00:00', close: '23:59' }],
      saturday: [{ open: '00:00', close: '23:59' }],
      sunday: [{ open: '00:00', close: '23:59' }],
    },
  },
  {
    id: 'ichiran-kokura',
    name: '一蘭 小倉店',
    address: '福岡県北九州市小倉北区京町2-7-11',
    googleMapsUrl: 'https://maps.google.com/?q=一蘭小倉店',
    category: 'ラーメン',
    businessHours: {
      monday: [{ open: '10:00', close: '03:00' }],
      tuesday: [{ open: '10:00', close: '03:00' }],
      wednesday: [{ open: '10:00', close: '03:00' }],
      thursday: [{ open: '10:00', close: '03:00' }],
      friday: [{ open: '10:00', close: '05:00' }],
      saturday: [{ open: '10:00', close: '05:00' }],
      sunday: [{ open: '10:00', close: '03:00' }],
    },
  },
  {
    id: 'shiroya-bakery',
    name: 'シロヤベーカリー 小倉店',
    address: '福岡県北九州市小倉北区京町2-6-14',
    googleMapsUrl: 'https://maps.google.com/?q=シロヤベーカリー小倉店',
    category: 'カフェ',
    businessHours: {
      monday: [{ open: '08:00', close: '20:00' }],
      tuesday: [{ open: '08:00', close: '20:00' }],
      wednesday: [{ open: '08:00', close: '20:00' }],
      thursday: [{ open: '08:00', close: '20:00' }],
      friday: [{ open: '08:00', close: '20:00' }],
      saturday: [{ open: '08:00', close: '20:00' }],
      sunday: [{ open: '08:00', close: '20:00' }],
    },
  },
];

async function addInitialData() {
  try {
    // 既存のデータを取得
    const existing = await redis.get('restaurants');
    let restaurants = [];
    
    if (existing) {
      if (typeof existing === 'string') {
        try {
          restaurants = JSON.parse(existing);
        } catch {
          restaurants = [];
        }
      } else if (Array.isArray(existing)) {
        restaurants = existing;
      }
    }
    
    // 初期データを追加（重複チェック）
    for (const restaurant of initialData) {
      const exists = restaurants.some(r => r.id === restaurant.id || r.name === restaurant.name);
      if (!exists) {
        restaurants.push(restaurant);
        console.log(`Added: ${restaurant.name}`);
      } else {
        console.log(`Skipped (already exists): ${restaurant.name}`);
      }
    }
    
    // 保存
    await redis.set('restaurants', restaurants);
    console.log(`\nTotal restaurants: ${restaurants.length}`);
    console.log('Initial data added successfully!');
  } catch (error) {
    console.error('Error adding initial data:', error);
  }
}

addInitialData();