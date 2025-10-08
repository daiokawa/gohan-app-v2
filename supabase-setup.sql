-- Gohan App - Restaurants Table Setup for Supabase

-- Drop existing table if exists
DROP TABLE IF EXISTS restaurants CASCADE;

-- Create restaurants table
CREATE TABLE restaurants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  google_maps_url TEXT,
  address TEXT,
  category TEXT,
  business_hours JSONB DEFAULT '{}',
  coordinates JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_restaurants_updated_at 
  BEFORE UPDATE ON restaurants 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
CREATE POLICY "Public read access" ON restaurants
  FOR SELECT
  USING (true);

-- Create policy for authenticated users to insert/update/delete
CREATE POLICY "Authenticated users can insert" ON restaurants
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update" ON restaurants
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete" ON restaurants
  FOR DELETE
  USING (true);

-- Create indexes for better performance
CREATE INDEX idx_restaurants_name ON restaurants(name);
CREATE INDEX idx_restaurants_category ON restaurants(category);
CREATE INDEX idx_restaurants_coordinates ON restaurants(coordinates);