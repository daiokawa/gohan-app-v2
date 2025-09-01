import { Redis } from '@upstash/redis';
import { Restaurant } from '@/types/restaurant';

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

const RESTAURANTS_KEY = 'restaurants';

export async function getRestaurants(): Promise<Restaurant[]> {
  try {
    const data = await redis.get(RESTAURANTS_KEY);
    
    // Handle different data structures from Redis
    let restaurants: Restaurant[] = [];
    if (data) {
      if (typeof data === 'string') {
        try {
          restaurants = JSON.parse(data);
        } catch {
          restaurants = [];
        }
      } else if (Array.isArray(data)) {
        restaurants = data;
      } else if (typeof data === 'object' && 'value' in data) {
        // Handle wrapped value
        const value = (data as any).value;
        if (typeof value === 'string') {
          try {
            restaurants = JSON.parse(value);
          } catch {
            restaurants = [];
          }
        } else if (Array.isArray(value)) {
          restaurants = value;
        }
      }
    }
    
    // データ構造の正規化（単一TimeSlotを配列に変換）
    return restaurants.map(normalizeRestaurant);
  } catch (error) {
    console.error('KV Error:', error);
    return [];
  }
}

export async function saveRestaurants(restaurants: Restaurant[]): Promise<void> {
  await redis.set(RESTAURANTS_KEY, restaurants);
}

export async function addRestaurant(restaurant: Restaurant): Promise<Restaurant[]> {
  const restaurants = await getRestaurants();
  const normalized = normalizeRestaurant(restaurant);
  restaurants.push(normalized);
  await saveRestaurants(restaurants);
  return restaurants;
}

export async function updateRestaurant(id: string, restaurant: Restaurant): Promise<Restaurant[]> {
  const restaurants = await getRestaurants();
  const index = restaurants.findIndex(r => r.id === id);
  if (index !== -1) {
    restaurants[index] = normalizeRestaurant(restaurant);
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

// 古いデータ構造（単一TimeSlot）を新しい構造（TimeSlot配列）に変換
function normalizeRestaurant(restaurant: Restaurant): Restaurant {
  const normalized: Restaurant = { ...restaurant };
  
  if (restaurant.businessHours) {
    const newHours: any = {};
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    
    for (const day of days) {
      const hours = (restaurant.businessHours as any)[day];
      if (hours) {
        if (Array.isArray(hours)) {
          newHours[day] = hours;
        } else if (typeof hours === 'object' && hours.open && hours.close) {
          // 単一のTimeSlotを配列に変換
          newHours[day] = [hours];
        }
      }
    }
    
    normalized.businessHours = newHours;
  }
  
  return normalized;
}