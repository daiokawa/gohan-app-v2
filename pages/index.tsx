import React, { useState, useEffect, useMemo } from 'react';
import Head from 'next/head';
import { Restaurant } from '@/types/restaurant';
import { isRestaurantOpen } from '@/utils/timeUtils';
import { getRestaurantStatus } from '@/utils/restaurantStatus';
import { calculateDistance } from '@/utils/distance';

export default function Home() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [gettingLocation, setGettingLocation] = useState(false);

  useEffect(() => {
    loadRestaurants();
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const loadRestaurants = async () => {
    try {
      // キャッシュバスター付きでAPIを取りに行く（必ず最新を取得）
      const res = await fetch(`/api/restaurants?ts=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        setRestaurants(data);
        // APIが成功したらlocalStorageを更新
        localStorage.setItem('restaurants', JSON.stringify(data));
      } else {
        throw new Error('API response not ok');
      }
    } catch (error) {
      console.error('Failed to load restaurants from API:', error);
      // APIが失敗した時だけlocalStorageから復元
      const saved = localStorage.getItem('restaurants');
      if (saved) {
        console.log('Using cached data from localStorage');
        setRestaurants(JSON.parse(saved));
      } else {
        setRestaurants([]);
      }
    } finally {
      setLoading(false);
    }
  };


  const getUserLocation = () => {
    setGettingLocation(true);
    
    if (!navigator.geolocation) {
      alert('お使いのブラウザは位置情報に対応していません');
      setGettingLocation(false);
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setGettingLocation(false);
        console.log('位置取得成功:', position.coords.latitude, position.coords.longitude);
      },
      (error) => {
        console.error('Location error:', error);
        
        // 開発環境用のフォールバック（小倉駅周辺）
        if (error.code === error.POSITION_UNAVAILABLE || error.message?.includes('kCLErrorLocationUnknown')) {
          const mockLocation = {
            lat: 33.8850,  // 小倉駅
            lng: 130.8836
          };
          setUserLocation(mockLocation);
          setGettingLocation(false);
          console.log('開発環境: モック位置使用（小倉駅）', mockLocation);
          return;
        }
        
        let message = '位置情報の取得に失敗しました: ';
        switch(error.code) {
          case error.PERMISSION_DENIED:
            message += '位置情報の使用が許可されていません';
            break;
          case error.POSITION_UNAVAILABLE:
            message += '位置情報が利用できません';
            break;
          case error.TIMEOUT:
            message += 'タイムアウトしました';
            break;
          default:
            message += error.message;
        }
        alert(message);
        setGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 30000,
        maximumAge: 0
      }
    );
  };

  const filteredRestaurants = useMemo(() => {
    let filtered = restaurants;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(r => 
        r.name.toLowerCase().includes(query)
      );
    }
    
    // 距離計算と並び替え
    if (userLocation) {
      filtered = filtered.map(restaurant => {
        let distance: number | undefined;
        if (restaurant.coordinates) {
          distance = calculateDistance(
            userLocation.lat,
            userLocation.lng,
            restaurant.coordinates.lat,
            restaurant.coordinates.lng
          );
        }
        return { ...restaurant, distance };
      });
    }
    
    // ソート: 距離順のみ（営業状態での優先順位は表示時に分離するため不要）
    return filtered.sort((a, b) => {
      // 距離でソート（近い順）
      if (userLocation && 'distance' in a && 'distance' in b) {
        if (a.distance !== undefined && b.distance !== undefined) {
          return a.distance - b.distance;
        }
        if (a.distance !== undefined) return -1;
        if (b.distance !== undefined) return 1;
      }
      
      return 0;
    });
  }, [restaurants, searchQuery, currentTime, userLocation]);


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-300" style={{ backgroundColor: '#c0c0c0' }}>
      <Head>
        <title>開いてるお店🍚 - 近所の飲食店</title>
        <meta name="description" content="毎日使う近所の飲食店情報" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <header className="mb-8 p-4" style={{
          backgroundColor: '#008080',
          border: '3px solid #000',
          borderTopColor: '#40c0c0',
          borderLeftColor: '#40c0c0',
          borderRightColor: '#004040',
          borderBottomColor: '#004040'
        }}>
          <h1 className="text-3xl font-bold text-white mb-2" style={{ fontFamily: 'serif' }}>開いてるお店🍚</h1>
          <p className="text-white font-semibold">近所の飲食店 • 現在: {currentTime.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}</p>
        </header>

        <div className="mb-6 space-y-4">
          <div className="flex gap-2 flex-wrap">
            <input
              type="text"
              placeholder="店名で検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 min-w-[120px] px-4 py-2"
              style={{
                backgroundColor: '#ffffff',
                border: '2px solid #000',
                borderTopColor: '#606060',
                borderLeftColor: '#606060',
                borderRightColor: '#ffffff',
                borderBottomColor: '#ffffff'
              }}
            />
            <button
              onClick={getUserLocation}
              disabled={gettingLocation}
              className="px-4 py-2 font-bold"
              style={{
                backgroundColor: gettingLocation ? '#606060' : '#4080c0',
                color: '#ffffff',
                border: '3px solid #000',
                borderTopColor: gettingLocation ? '#808080' : '#80c0ff',
                borderLeftColor: gettingLocation ? '#808080' : '#80c0ff',
                borderRightColor: gettingLocation ? '#404040' : '#204060',
                borderBottomColor: gettingLocation ? '#404040' : '#204060'
              }}
            >
              {gettingLocation ? '取得中...' : userLocation ? '📍 再取得' : '📍 現在地'}
            </button>
            <button
              onClick={() => window.location.href = '/add'}
              className="px-6 py-2 font-bold"
              style={{
                backgroundColor: '#008080',
                color: '#ffffff',
                border: '3px solid #000',
                borderTopColor: '#40c0c0',
                borderLeftColor: '#40c0c0',
                borderRightColor: '#004040',
                borderBottomColor: '#004040'
              }}
            >
              + 店舗追加
            </button>
          </div>
          {userLocation && (
            <div className="text-sm text-gray-600">
              現在地から距離順に表示中
              <span className="text-xs ml-2">
                (緯度: {userLocation.lat.toFixed(4)}, 経度: {userLocation.lng.toFixed(4)})
              </span>
            </div>
          )}
        </div>

        {/* 営業中の店舗 */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {(() => {
            const openRestaurants = filteredRestaurants.filter(r => getRestaurantStatus(r, currentTime).isOpen);
            // 閉店直前の店舗を先に、その後距離順で残りの営業中店舗
            const closingSoon = openRestaurants.filter(r => getRestaurantStatus(r, currentTime).isClosingSoon);
            const notClosingSoon = openRestaurants.filter(r => !getRestaurantStatus(r, currentTime).isClosingSoon);
            return [...closingSoon, ...notClosingSoon];
          })().map(restaurant => {
            const status = getRestaurantStatus(restaurant, currentTime);
            return (
              <div
                key={restaurant.id}
                className={`p-3 transition-all ${
                  status.isOpen 
                    ? 'bg-teal-100' 
                    : 'bg-gray-200'
                }`}
                style={{
                  border: '2px solid #000',
                  borderRightWidth: '3px',
                  borderBottomWidth: '3px',
                  borderTopColor: '#ffffff',
                  borderLeftColor: '#ffffff',
                  borderRightColor: status.isOpen ? '#004040' : '#606060',
                  borderBottomColor: status.isOpen ? '#004040' : '#606060',
                  backgroundColor: status.isOpen ? '#b0d0d0' : '#d0d0d0'
                }}
              >
                <div className="mb-2">
                  <h3 className="text-sm font-semibold text-gray-800 mb-1">{restaurant.name}</h3>
                  <div className="flex items-center justify-between gap-1 flex-wrap">
                    <div className="flex items-center gap-1">
                      <span 
                        className="px-2 py-0.5 text-xs font-bold"
                        style={{
                          backgroundColor: status.isOpen ? '#008080' : '#808080',
                          color: '#ffffff',
                          border: '1px solid #000000'
                        }}>
                        {status.isOpen ? '営業中' : '時間外'}
                      </span>
                      {status.isOpen && status.closeTime && (
                        <span className="text-xs text-gray-600">
                          {status.closeTime}まで
                          {status.isClosingSoon && <><span className="text-lg"> 🏃</span>=3</>}
                        </span>
                      )}
                      {!status.isOpen && status.openTime && (
                        <span className="text-xs text-gray-600">
                          {status.openDay === 'today' ? status.openTime : 
                           status.openDay === 'tomorrow' ? `明日${status.openTime}` :
                           status.openTime}開店
                        </span>
                      )}
                    </div>
                    {'distance' in restaurant && restaurant.distance !== undefined && (
                      <span className="text-xs text-gray-700">
                        📍{restaurant.distance < 1 
                          ? `${Math.round(restaurant.distance * 1000)}m` 
                          : `${restaurant.distance.toFixed(1)}km`}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-1 mt-2">
                  {restaurant.googleMapsUrl && (
                    <a
                      href={restaurant.googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 px-2 py-1 text-xs text-center font-semibold"
                      style={{
                        backgroundColor: '#a0a0a0',
                        color: '#000000',
                        border: '2px solid #000',
                        borderTopColor: '#ffffff',
                        borderLeftColor: '#ffffff',
                        borderRightColor: '#606060',
                        borderBottomColor: '#606060'
                      }}
                    >
                      地図
                    </a>
                  )}
                  <button
                    onClick={() => window.location.href = `/edit?id=${restaurant.id}`}
                    className="flex-1 px-2 py-1 text-xs font-semibold"
                    style={{
                      backgroundColor: '#a0a0a0',
                      color: '#000000',
                      border: '2px solid #000',
                      borderTopColor: '#ffffff',
                      borderLeftColor: '#ffffff',
                      borderRightColor: '#606060',
                      borderBottomColor: '#606060'
                    }}
                  >
                    編集
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* 閉店中の店舗との区切り線 */}
        {filteredRestaurants.filter(r => !getRestaurantStatus(r, currentTime).isOpen).length > 0 && 
         filteredRestaurants.filter(r => getRestaurantStatus(r, currentTime).isOpen).length > 0 && (
          <div className="my-6">
            <hr style={{
              border: 'none',
              borderTop: '2px solid #808080',
              borderBottom: '1px solid #ffffff',
              height: '3px'
            }} />
          </div>
        )}
        
        {/* 閉店中の店舗 */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {filteredRestaurants
            .filter(r => !getRestaurantStatus(r, currentTime).isOpen)
            .sort((a, b) => {
              // 次の開店時間で並び替え
              const aStatus = getRestaurantStatus(a, currentTime);
              const bStatus = getRestaurantStatus(b, currentTime);
              
              // 両方に開店時間がある場合
              if (aStatus.openTime && bStatus.openTime) {
                // 同じ日の開店時間で比較
                if (aStatus.openDay === bStatus.openDay) {
                  return aStatus.openTime.localeCompare(bStatus.openTime);
                }
                // 今日 > 明日 > その他
                if (aStatus.openDay === 'today') return -1;
                if (bStatus.openDay === 'today') return 1;
                if (aStatus.openDay === 'tomorrow') return -1;
                if (bStatus.openDay === 'tomorrow') return 1;
              }
              
              // 開店時間がない場合は距離でソート
              if ('distance' in a && 'distance' in b) {
                if (a.distance !== undefined && b.distance !== undefined) {
                  return a.distance - b.distance;
                }
              }
              
              return 0;
            })
            .map(restaurant => {
            const status = getRestaurantStatus(restaurant, currentTime);
            return (
              <div
                key={restaurant.id}
                className={`p-3 transition-all ${
                  status.isOpen 
                    ? 'bg-teal-100' 
                    : 'bg-gray-200'
                }`}
                style={{
                  border: '2px solid #000',
                  borderRightWidth: '3px',
                  borderBottomWidth: '3px',
                  borderTopColor: '#ffffff',
                  borderLeftColor: '#ffffff',
                  borderRightColor: status.isOpen ? '#004040' : '#606060',
                  borderBottomColor: status.isOpen ? '#004040' : '#606060',
                  backgroundColor: status.isOpen ? '#b0d0d0' : '#d0d0d0'
                }}
              >
                <div className="mb-2">
                  <h3 className="text-sm font-semibold text-gray-800 mb-1">{restaurant.name}</h3>
                  <div className="flex items-center justify-between gap-1 flex-wrap">
                    <div className="flex items-center gap-1">
                      <span 
                        className="px-2 py-0.5 text-xs font-bold"
                        style={{
                          backgroundColor: status.isOpen ? '#008080' : '#808080',
                          color: '#ffffff',
                          border: '1px solid #000000'
                        }}>
                        {status.isOpen ? '営業中' : '時間外'}
                      </span>
                      {status.isOpen && status.closeTime && (
                        <span className="text-xs text-gray-600">
                          {status.closeTime}まで
                          {status.isClosingSoon && <><span className="text-lg"> 🏃</span>=3</>}
                        </span>
                      )}
                      {!status.isOpen && status.openTime && (
                        <span className="text-xs text-gray-600">
                          {status.openDay === 'today' ? status.openTime : 
                           status.openDay === 'tomorrow' ? `明日${status.openTime}` :
                           status.openTime}開店
                        </span>
                      )}
                    </div>
                    {'distance' in restaurant && restaurant.distance !== undefined && (
                      <span className="text-xs text-gray-700">
                        📍{restaurant.distance < 1 
                          ? `${Math.round(restaurant.distance * 1000)}m` 
                          : `${restaurant.distance.toFixed(1)}km`}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-1 mt-2">
                  {restaurant.googleMapsUrl && (
                    <a
                      href={restaurant.googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 px-2 py-1 text-xs text-center font-semibold"
                      style={{
                        backgroundColor: '#a0a0a0',
                        color: '#000000',
                        border: '2px solid #000',
                        borderTopColor: '#ffffff',
                        borderLeftColor: '#ffffff',
                        borderRightColor: '#606060',
                        borderBottomColor: '#606060'
                      }}
                    >
                      地図
                    </a>
                  )}
                  <button
                    onClick={() => window.location.href = `/edit?id=${restaurant.id}`}
                    className="flex-1 px-2 py-1 text-xs font-semibold"
                    style={{
                      backgroundColor: '#a0a0a0',
                      color: '#000000',
                      border: '2px solid #000',
                      borderTopColor: '#ffffff',
                      borderLeftColor: '#ffffff',
                      borderRightColor: '#606060',
                      borderBottomColor: '#606060'
                    }}
                  >
                    編集
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        
        {filteredRestaurants.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            店舗が見つかりませんでした
          </div>
        )}
      </main>
    </div>
  );
}
