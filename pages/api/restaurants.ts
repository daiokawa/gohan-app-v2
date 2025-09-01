import type { NextApiRequest, NextApiResponse } from 'next';
import { Restaurant } from '@/types/restaurant';
import { getRestaurants, addRestaurant, updateRestaurant, deleteRestaurant, saveRestaurants } from '@/lib/json-db';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    if (req.method === 'GET') {
      const restaurants = await getRestaurants();
      return res.status(200).json(restaurants);
    }
    
    if (req.method === 'POST') {
      const newRestaurant: Restaurant = req.body;
      const updated = await addRestaurant(newRestaurant);
      return res.status(200).json(updated);
    }
    
    if (req.method === 'PUT') {
      // Bulk update or single update
      if (Array.isArray(req.body)) {
        await saveRestaurants(req.body);
        return res.status(200).json(req.body);
      } else {
        const restaurant: Restaurant = req.body;
        const updated = await updateRestaurant(restaurant.id, restaurant);
        return res.status(200).json(updated);
      }
    }
    
    if (req.method === 'DELETE') {
      const { id } = req.query;
      if (typeof id === 'string') {
        const updated = await deleteRestaurant(id);
        return res.status(200).json(updated);
      }
      return res.status(400).json({ error: 'ID is required' });
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}