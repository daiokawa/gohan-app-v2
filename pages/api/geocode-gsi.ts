import type { NextApiRequest, NextApiResponse } from 'next';

interface GeocodingResult {
  latitude?: number;
  longitude?: number;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<GeocodingResult>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { address } = req.body;
  
  if (!address) {
    return res.status(400).json({ error: 'Address is required' });
  }

  try {
    // 国土地理院のジオコーディングAPI
    const encodedAddress = encodeURIComponent(address);
    const gsiUrl = `https://msearch.gsi.go.jp/address-search/AddressSearch?q=${encodedAddress}`;
    
    const response = await fetch(gsiUrl);
    
    if (!response.ok) {
      throw new Error('GSI API request failed');
    }
    
    const data = await response.json();
    
    if (data && data.length > 0) {
      // 最初の結果を使用
      const result = data[0];
      const coordinates = result.geometry?.coordinates;
      
      if (coordinates && coordinates.length >= 2) {
        // GSI APIは[経度, 緯度]の順で返す
        return res.status(200).json({
          latitude: coordinates[1],
          longitude: coordinates[0],
        });
      }
    }
    
    // 結果がない場合は、Nominatim APIにフォールバック
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&countrycodes=jp&limit=1`;
    
    const nominatimResponse = await fetch(nominatimUrl, {
      headers: {
        'User-Agent': 'Gohan-Restaurant-App/1.0',
      },
    });
    
    if (nominatimResponse.ok) {
      const nominatimData = await nominatimResponse.json();
      
      if (nominatimData && nominatimData.length > 0) {
        const result = nominatimData[0];
        return res.status(200).json({
          latitude: parseFloat(result.lat),
          longitude: parseFloat(result.lon),
        });
      }
    }
    
    return res.status(404).json({ error: 'No coordinates found for the address' });
  } catch (error) {
    console.error('Geocoding error:', error);
    return res.status(500).json({ error: 'Failed to geocode address' });
  }
}