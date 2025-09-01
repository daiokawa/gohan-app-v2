import { Restaurant, TimeSlot } from '@/types/restaurant';

export function getRestaurantStatus(restaurant: Restaurant, now: Date = new Date()) {
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const currentDay = dayNames[now.getDay()];
  const currentTime = now.getHours() * 60 + now.getMinutes();
  
  const todayHours = (restaurant.businessHours as any)[currentDay] as TimeSlot[] | undefined;
  
  // 現在営業中のスロットを探す
  if (todayHours && todayHours.length > 0) {
    for (const slot of todayHours) {
      const openTime = timeToMinutes(slot.open);
      const closeTime = timeToMinutes(slot.close);
      
      // 深夜営業の場合
      if (closeTime < openTime) {
        if (currentTime >= openTime || currentTime < closeTime) {
          // 営業中
          const actualCloseTime = currentTime >= openTime ? closeTime + 24 * 60 : closeTime;
          const minutesUntilClose = actualCloseTime - currentTime;
          return {
            isOpen: true,
            closeTime: slot.close,
            minutesUntilClose,
            isClosingSoon: minutesUntilClose <= 59
          };
        }
      } else {
        if (currentTime >= openTime && currentTime < closeTime) {
          // 営業中
          const minutesUntilClose = closeTime - currentTime;
          return {
            isOpen: true,
            closeTime: slot.close,
            minutesUntilClose,
            isClosingSoon: minutesUntilClose <= 59
          };
        }
      }
    }
  }
  
  // 営業時間外 - 次の開店時間を探す
  let nextOpenTime: string | null = null;
  let nextOpenDay = '';
  let minutesUntilOpen = Infinity;
  
  // 今日の残りの時間をチェック
  if (todayHours) {
    for (const slot of todayHours) {
      const openTime = timeToMinutes(slot.open);
      if (openTime > currentTime) {
        const minutes = openTime - currentTime;
        if (minutes < minutesUntilOpen) {
          minutesUntilOpen = minutes;
          nextOpenTime = slot.open;
          nextOpenDay = 'today';
        }
      }
    }
  }
  
  // 明日以降をチェック（1週間分）
  if (!nextOpenTime) {
    for (let i = 1; i <= 7; i++) {
      const checkDay = dayNames[(now.getDay() + i) % 7];
      const checkHours = (restaurant.businessHours as any)[checkDay] as TimeSlot[] | undefined;
      
      if (checkHours && checkHours.length > 0) {
        nextOpenTime = checkHours[0].open;
        nextOpenDay = i === 1 ? 'tomorrow' : checkDay;
        break;
      }
    }
  }
  
  return {
    isOpen: false,
    openTime: nextOpenTime,
    openDay: nextOpenDay,
    minutesUntilOpen,
    isClosingSoon: false
  };
}

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}