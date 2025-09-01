import { Restaurant } from '@/types/restaurant';
import fs from 'fs';
import path from 'path';
import { syncToMultipleDestinations } from './sync-data';

const DATA_FILE = path.join(process.cwd(), 'data', 'restaurants.json');

// ファイルが存在しない場合は作成
if (!fs.existsSync(DATA_FILE)) {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(DATA_FILE, '[]');
}

export async function getRestaurants(): Promise<Restaurant[]> {
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Failed to read restaurants:', error);
    return [];
  }
}

export async function saveRestaurants(restaurants: Restaurant[]): Promise<void> {
  try {
    // メインファイルに保存
    fs.writeFileSync(DATA_FILE, JSON.stringify(restaurants, null, 2));
    
    // 複数の場所に自動同期（非同期でバックグラウンド実行）
    syncToMultipleDestinations(restaurants).catch(error => {
      console.error('同期エラー（メイン保存は成功）:', error);
    });
  } catch (error) {
    console.error('Failed to save restaurants:', error);
  }
}

export async function addRestaurant(restaurant: Restaurant): Promise<Restaurant[]> {
  const restaurants = await getRestaurants();
  const exists = restaurants.some(r => r.id === restaurant.id);
  if (!exists) {
    restaurants.push(restaurant);
    await saveRestaurants(restaurants);
  }
  return restaurants;
}

export async function updateRestaurant(id: string, restaurant: Restaurant): Promise<Restaurant[]> {
  const restaurants = await getRestaurants();
  const index = restaurants.findIndex(r => r.id === id);
  if (index !== -1) {
    restaurants[index] = restaurant;
    await saveRestaurants(restaurants);
  }
  return restaurants;
}

export async function deleteRestaurant(id: string): Promise<Restaurant[]> {
  const restaurants = await getRestaurants();
  const filtered = restaurants.filter(r => r.id !== id);
  await saveRestaurants(filtered);
  return filtered;
}