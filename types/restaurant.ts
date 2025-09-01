export interface TimeSlot {
  open: string;   // "11:00"
  close: string;  // "21:00"
}

export interface BusinessHours {
  monday?: TimeSlot[];
  tuesday?: TimeSlot[];
  wednesday?: TimeSlot[];
  thursday?: TimeSlot[];
  friday?: TimeSlot[];
  saturday?: TimeSlot[];
  sunday?: TimeSlot[];
}

export interface Restaurant {
  id: string;
  name: string;
  googleMapsUrl: string;
  address?: string;
  businessHours: BusinessHours;
  category: string;
  distance?: number;
  closedDays?: string[];
  latitude?: number;
  longitude?: number;
  coordinates?: {
    lat: number;
    lng: number;
  };
}