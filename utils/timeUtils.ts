import { Restaurant, BusinessHours, TimeSlot } from '@/types/restaurant';

export function isRestaurantOpen(restaurant: Restaurant, now: Date = new Date()): boolean {
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const currentDay = dayNames[now.getDay()];
  const currentTime = now.getHours() * 60 + now.getMinutes();
  
  const todayHours = (restaurant.businessHours as any)[currentDay] as TimeSlot[] | undefined;
  
  if (!todayHours || todayHours.length === 0) {
    return false;
  }
  
  // 複数のタイムスロットに対応（昼・夜の2部制など）
  return todayHours.some((slot: TimeSlot) => {
    const openTime = timeToMinutes(slot.open);
    const closeTime = timeToMinutes(slot.close);
    
    // 深夜営業の場合（closeTime < openTime）
    if (closeTime < openTime) {
      return currentTime >= openTime || currentTime < closeTime;
    }
    
    return currentTime >= openTime && currentTime < closeTime;
  });
}

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

export function formatBusinessHours(businessHours: BusinessHours): string {
  const dayNames = ['月', '火', '水', '木', '金', '土', '日'];
  const dayKeys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  
  const formatted = dayKeys.map((key, index) => {
    const hours = (businessHours as any)[key] as TimeSlot[] | undefined;
    if (!hours || hours.length === 0) {
      return `${dayNames[index]}: 定休日`;
    }
    
    const slots = hours.map(slot => `${slot.open}-${slot.close}`).join(', ');
    return `${dayNames[index]}: ${slots}`;
  });
  
  return formatted.join('\n');
}