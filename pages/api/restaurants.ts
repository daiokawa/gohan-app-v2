import type { NextApiRequest, NextApiResponse } from 'next';
import { Restaurant } from '@/types/restaurant';
import { getRestaurants as getRestaurantsJson, addRestaurant as addRestaurantJson, updateRestaurant as updateRestaurantJson, deleteRestaurant as deleteRestaurantJson, saveRestaurants as saveRestaurantsJson } from '@/lib/json-db';
import { getRestaurants as getRestaurantsKV, addRestaurant as addRestaurantKV, updateRestaurant as updateRestaurantKV, deleteRestaurant as deleteRestaurantKV, saveRestaurants as saveRestaurantsKV } from '@/lib/kv';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

// 優先順位: KV > Supabase > JSON DB
const isKVConfigured = Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);

// Supabase用のデータ変換
function convertFromSupabase(data: any): Restaurant {
  return {
    id: data.id,
    name: data.name,
    googleMapsUrl: data.google_maps_url || '',
    address: data.address || '',
    category: data.category || '',
    businessHours: data.business_hours || {},
    coordinates: data.coordinates || undefined
  };
}

function convertToSupabase(restaurant: Restaurant): any {
  return {
    name: restaurant.name,
    google_maps_url: restaurant.googleMapsUrl || null,
    address: restaurant.address || null,
    category: restaurant.category || null,
    business_hours: restaurant.businessHours || {},
    coordinates: restaurant.coordinates || null
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // 優先順位: KV > Supabase > JSON DB
    if (isKVConfigured) {
      // Upstash KVを使用
      if (req.method === 'GET') {
        const restaurants = await getRestaurantsKV();
        return res.status(200).json(restaurants);
      }

      if (req.method === 'POST') {
        const newRestaurant: Restaurant = req.body;
        const updated = await addRestaurantKV(newRestaurant);
        return res.status(200).json(updated);
      }

      if (req.method === 'PUT') {
        if (Array.isArray(req.body)) {
          await saveRestaurantsKV(req.body);
          return res.status(200).json(req.body);
        } else {
          const restaurant: Restaurant = req.body;
          const updated = await updateRestaurantKV(restaurant.id, restaurant);
          return res.status(200).json(updated);
        }
      }

      if (req.method === 'DELETE') {
        const { id } = req.query;
        if (typeof id === 'string') {
          const updated = await deleteRestaurantKV(id);
          return res.status(200).json(updated);
        }
        return res.status(400).json({ error: 'ID is required' });
      }

      return res.status(405).json({ error: 'Method not allowed' });
    }
    // Supabaseが設定されている場合はSupabaseを使用
    else if (isSupabaseConfigured && supabase) {
      if (req.method === 'GET') {
        const { data, error } = await supabase
          .from('restaurants')
          .select('*')
          .order('name');
        
        if (error) throw error;
        const restaurants = data.map(convertFromSupabase);
        return res.status(200).json(restaurants);
      }
      
      if (req.method === 'POST') {
        const newRestaurant: Restaurant = req.body;
        const supabaseData = convertToSupabase(newRestaurant);
        
        const { data, error } = await supabase
          .from('restaurants')
          .insert([supabaseData])
          .select()
          .single();
        
        if (error) throw error;
        return res.status(200).json(convertFromSupabase(data));
      }
      
      if (req.method === 'PUT') {
        if (Array.isArray(req.body)) {
          // バルク更新（現在は未使用）
          return res.status(400).json({ error: 'Bulk update not supported with Supabase' });
        } else {
          const restaurant: Restaurant = req.body;
          const supabaseData = convertToSupabase(restaurant);
          
          const { data, error } = await supabase
            .from('restaurants')
            .update(supabaseData)
            .eq('id', restaurant.id)
            .select()
            .single();
          
          if (error) throw error;
          return res.status(200).json(convertFromSupabase(data));
        }
      }
      
      if (req.method === 'DELETE') {
        const { id } = req.query;
        if (typeof id === 'string') {
          const { error } = await supabase
            .from('restaurants')
            .delete()
            .eq('id', id);
          
          if (error) throw error;
          
          // 削除後の全データを返す
          const { data: remaining } = await supabase
            .from('restaurants')
            .select('*')
            .order('name');
          
          const restaurants = remaining?.map(convertFromSupabase) || [];
          return res.status(200).json(restaurants);
        }
        return res.status(400).json({ error: 'ID is required' });
      }
      
      return res.status(405).json({ error: 'Method not allowed' });
    } 
    // KVもSupabaseも設定されていない場合は従来のJSON DBを使用
    else {
      if (req.method === 'GET') {
        const restaurants = await getRestaurantsJson();
        return res.status(200).json(restaurants);
      }

      if (req.method === 'POST') {
        const newRestaurant: Restaurant = req.body;
        const updated = await addRestaurantJson(newRestaurant);
        return res.status(200).json(updated);
      }

      if (req.method === 'PUT') {
        if (Array.isArray(req.body)) {
          await saveRestaurantsJson(req.body);
          return res.status(200).json(req.body);
        } else {
          const restaurant: Restaurant = req.body;
          const updated = await updateRestaurantJson(restaurant.id, restaurant);
          return res.status(200).json(updated);
        }
      }

      if (req.method === 'DELETE') {
        const { id } = req.query;
        if (typeof id === 'string') {
          const updated = await deleteRestaurantJson(id);
          return res.status(200).json(updated);
        }
        return res.status(400).json({ error: 'ID is required' });
      }

      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}