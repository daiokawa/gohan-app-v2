import React, { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { Restaurant, BusinessHours, TimeSlot } from '@/types/restaurant';

const DAYS = [
  { key: 'monday', label: '月曜日' },
  { key: 'tuesday', label: '火曜日' },
  { key: 'wednesday', label: '水曜日' },
  { key: 'thursday', label: '木曜日' },
  { key: 'friday', label: '金曜日' },
  { key: 'saturday', label: '土曜日' },
  { key: 'sunday', label: '日曜日' },
];


export default function AddRestaurant() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [googleMapsUrl, setGoogleMapsUrl] = useState('');
  const [address, setAddress] = useState('');
  const [businessHours, setBusinessHours] = useState<BusinessHours>({});
  const [loading, setLoading] = useState(false);

  const handleTimeChange = (day: string, index: number, field: 'open' | 'close', value: string) => {
    const dayHours = (businessHours as any)[day] || [];
    const newDayHours = [...dayHours];
    if (!newDayHours[index]) {
      newDayHours[index] = { open: '', close: '' };
    }
    newDayHours[index][field] = value;
    setBusinessHours({
      ...businessHours,
      [day]: newDayHours.filter((slot: TimeSlot) => slot.open || slot.close)
    });
  };

  const addTimeSlot = (day: string) => {
    const dayHours = (businessHours as any)[day] || [];
    setBusinessHours({
      ...businessHours,
      [day]: [...dayHours, { open: '', close: '' }]
    });
  };

  const removeTimeSlot = (day: string, index: number) => {
    const dayHours = (businessHours as any)[day] || [];
    setBusinessHours({
      ...businessHours,
      [day]: dayHours.filter((_: TimeSlot, i: number) => i !== index)
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      alert('店舗名は必須です');
      return;
    }

    setLoading(true);
    
    // Google Maps URLを自動生成（入力がない場合）
    const mapsUrl = googleMapsUrl || `https://maps.google.com/?q=${encodeURIComponent(name + (address ? ' ' + address : ''))}`;
    
    // 住所から座標を自動取得
    let coordinates = undefined;
    if (address) {
      try {
        const res = await fetch('/api/geocode-gsi', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ address }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.latitude && data.longitude) {
            coordinates = { lat: data.latitude, lng: data.longitude };
            console.log(`座標取得成功: ${name}`, coordinates);
          }
        }
      } catch (error) {
        console.error('座標取得エラー:', error);
      }
    }
    
    // 座標が取得できなかった場合は小倉駅周辺のデフォルト座標
    if (!coordinates) {
      coordinates = {
        lat: 33.8850 + (Math.random() - 0.5) * 0.02,
        lng: 130.8836 + (Math.random() - 0.5) * 0.02
      };
    }
    
    const newRestaurant: Restaurant = {
      id: Date.now().toString(),
      name,
      googleMapsUrl: mapsUrl,
      address,
      category: '',
      businessHours,
      coordinates,
    };

    try {
      const res = await fetch('/api/restaurants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRestaurant),
      });

      if (res.ok) {
        // 全件を取り直してlocalStorageを最新版に更新
        const refreshed = await fetch(`/api/restaurants?ts=${Date.now()}`).then(r => r.json());
        localStorage.setItem('restaurants', JSON.stringify(refreshed));
        
        // 本番環境の場合、GitHubへの自動同期を通知
        if (typeof window !== 'undefined' && window.location.hostname === 'gohan.ahillchan.com') {
          alert('✅ 新規店舗を追加しました！\n\n⚠️ 本番環境への反映には約1-2分かかります。\n自動的にGitHubと同期され、Vercelが再デプロイします。');
        }
        router.replace(`/?refresh=${Date.now()}`);
      } else {
        alert('店舗の追加に失敗しました');
      }
    } catch (error) {
      console.error('Failed to add restaurant:', error);
      alert('店舗の追加に失敗しました');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-gray-300" style={{ backgroundColor: '#c0c0c0' }}>
      <Head>
        <title>店舗追加 - Gohan</title>
      </Head>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="p-6" style={{
          backgroundColor: '#d0d0d0',
          border: '3px solid #000',
          borderTopColor: '#ffffff',
          borderLeftColor: '#ffffff',
          borderRightColor: '#606060',
          borderBottomColor: '#606060'
        }}>
          <h1 className="text-2xl font-bold mb-6" style={{ fontFamily: 'serif' }}>新規店舗追加</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">
                店舗名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2"
                style={{
                  backgroundColor: '#ffffff',
                  border: '2px solid #000',
                  borderTopColor: '#606060',
                  borderLeftColor: '#606060',
                  borderRightColor: '#ffffff',
                  borderBottomColor: '#ffffff'
                }}
                required
              />
            </div>


            <div>
              <label className="block text-sm font-medium mb-2">住所</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-2"
                style={{
                  backgroundColor: '#ffffff',
                  border: '2px solid #000',
                  borderTopColor: '#606060',
                  borderLeftColor: '#606060',
                  borderRightColor: '#ffffff',
                  borderBottomColor: '#ffffff'
                }}
                placeholder="福岡県北九州市小倉北区..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Google Maps URL（省略可）</label>
              <input
                type="url"
                value={googleMapsUrl}
                onChange={(e) => setGoogleMapsUrl(e.target.value)}
                className="w-full px-3 py-2"
                style={{
                  backgroundColor: '#ffffff',
                  border: '2px solid #000',
                  borderTopColor: '#606060',
                  borderLeftColor: '#606060',
                  borderRightColor: '#ffffff',
                  borderBottomColor: '#ffffff'
                }}
                placeholder="空欄の場合は店名から自動生成"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-4">営業時間</label>
              
              {/* 一括入力フィールド */}
              <div className="mb-4 p-3" style={{
                backgroundColor: '#e0e0e0',
                border: '2px solid #000',
                borderTopColor: '#ffffff',
                borderLeftColor: '#ffffff',
                borderRightColor: '#808080',
                borderBottomColor: '#808080'
              }}>
                <div className="mb-2">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">一括設定:</span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          // 既存の時間帯をクリアして24時間営業を設定
                          const container = document.getElementById('bulk-time-slots-add');
                          if (container) {
                            container.innerHTML = `
                              <div class="flex items-center gap-2 mb-2">
                                <input type="time" class="bulk-open px-2 py-1" value="00:00" style="background-color:#ffffff;border:2px solid #000;border-top-color:#606060;border-left-color:#606060;border-right-color:#ffffff;border-bottom-color:#ffffff" />
                                <span>〜</span>
                                <input type="time" class="bulk-close px-2 py-1" value="23:59" style="background-color:#ffffff;border:2px solid #000;border-top-color:#606060;border-left-color:#606060;border-right-color:#ffffff;border-bottom-color:#ffffff" />
                              </div>
                            `;
                          }
                        }}
                        className="px-2 py-1 text-white text-xs font-bold"
                        style={{
                          backgroundColor: '#4080c0',
                          border: '2px solid #000',
                          borderTopColor: '#80c0ff',
                          borderLeftColor: '#80c0ff',
                          borderRightColor: '#204060',
                          borderBottomColor: '#204060'
                        }}
                      >
                        24時間営業
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const container = document.getElementById('bulk-time-slots-add');
                          if (container) {
                            const newSlot = document.createElement('div');
                            newSlot.className = 'flex items-center gap-2 mb-2';
                            newSlot.innerHTML = `
                              <input type="time" class="bulk-open px-2 py-1" style="background-color:#ffffff;border:2px solid #000;border-top-color:#606060;border-left-color:#606060;border-right-color:#ffffff;border-bottom-color:#ffffff" />
                              <span>〜</span>
                              <input type="time" class="bulk-close px-2 py-1" style="background-color:#ffffff;border:2px solid #000;border-top-color:#606060;border-left-color:#606060;border-right-color:#ffffff;border-bottom-color:#ffffff" />
                              <button type="button" onclick="this.parentElement.remove()" class="px-2 py-1 text-white text-xs font-bold" style="background-color:#804040;border:2px solid #000;border-top-color:#c08080;border-left-color:#c08080;border-right-color:#402020;border-bottom-color:#402020">削除</button>
                            `;
                            container.appendChild(newSlot);
                          }
                        }}
                        className="px-2 py-1 text-white text-xs font-bold"
                        style={{
                          backgroundColor: '#008080',
                          border: '2px solid #000',
                          borderTopColor: '#40c0c0',
                          borderLeftColor: '#40c0c0',
                          borderRightColor: '#004040',
                          borderBottomColor: '#004040'
                        }}
                      >
                        + 時間帯追加
                      </button>
                    </div>
                  </div>
                  <div id="bulk-time-slots-add">
                    <div className="flex items-center gap-2 mb-2">
                      <input
                        type="time"
                        className="bulk-open px-2 py-1"
                        style={{
                          backgroundColor: '#ffffff',
                          border: '2px solid #000',
                          borderTopColor: '#606060',
                          borderLeftColor: '#606060',
                          borderRightColor: '#ffffff',
                          borderBottomColor: '#ffffff'
                        }}
                      />
                      <span>〜</span>
                      <input
                        type="time"
                        className="bulk-close px-2 py-1"
                        style={{
                          backgroundColor: '#ffffff',
                          border: '2px solid #000',
                          borderTopColor: '#606060',
                          borderLeftColor: '#606060',
                          borderRightColor: '#ffffff',
                          borderBottomColor: '#ffffff'
                        }}
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const openInputs = document.querySelectorAll('.bulk-open') as NodeListOf<HTMLInputElement>;
                      const closeInputs = document.querySelectorAll('.bulk-close') as NodeListOf<HTMLInputElement>;
                      const slots: any[] = [];
                      openInputs.forEach((openInput, index) => {
                        if (openInput.value && closeInputs[index]?.value) {
                          slots.push({ open: openInput.value, close: closeInputs[index].value });
                        }
                      });
                      if (slots.length > 0) {
                        const newHours: BusinessHours = {};
                        DAYS.forEach(day => {
                          newHours[day.key as keyof BusinessHours] = [...slots];
                        });
                        setBusinessHours(newHours);
                      }
                    }}
                    className="px-4 py-2 text-white text-sm font-bold mt-2"
                    style={{
                      backgroundColor: '#008080',
                      border: '3px solid #000',
                      borderTopColor: '#40c0c0',
                      borderLeftColor: '#40c0c0',
                      borderRightColor: '#004040',
                      borderBottomColor: '#004040'
                    }}
                  >
                    全曜日に適用
                  </button>
                </div>
              </div>
              
              <div className="space-y-4">
                {DAYS.map(day => {
                  const dayHours = (businessHours as any)[day.key] || [];
                  return (
                    <div key={day.key} className="p-3" style={{
                      backgroundColor: '#e0e0e0',
                      border: '2px solid #000',
                      borderTopColor: '#ffffff',
                      borderLeftColor: '#ffffff',
                      borderRightColor: '#808080',
                      borderBottomColor: '#808080'
                    }}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{day.label}</span>
                        <div className="space-x-2">
                          <button
                            type="button"
                            onClick={() => {
                              setBusinessHours({
                                ...businessHours,
                                [day.key]: []
                              });
                            }}
                            className="px-2 py-1 text-white text-xs font-bold"
                            style={{
                              backgroundColor: '#804040',
                              border: '2px solid #000',
                              borderTopColor: '#c08080',
                              borderLeftColor: '#c08080',
                              borderRightColor: '#402020',
                              borderBottomColor: '#402020'
                            }}
                          >
                            定休日
                          </button>
                          <button
                            type="button"
                            onClick={() => addTimeSlot(day.key)}
                            className="px-2 py-1 text-white text-xs font-bold"
                            style={{
                              backgroundColor: '#008080',
                              border: '2px solid #000',
                              borderTopColor: '#40c0c0',
                              borderLeftColor: '#40c0c0',
                              borderRightColor: '#004040',
                              borderBottomColor: '#004040'
                            }}
                          >
                            + 時間帯追加
                          </button>
                        </div>
                      </div>
                      {dayHours.map((slot: TimeSlot, index: number) => (
                        <div key={index} className="flex items-center gap-2 mb-2">
                          <input
                            type="time"
                            value={slot.open}
                            onChange={(e) => handleTimeChange(day.key, index, 'open', e.target.value)}
                            className="px-2 py-1"
                            style={{
                              backgroundColor: '#ffffff',
                              border: '2px solid #000',
                              borderTopColor: '#606060',
                              borderLeftColor: '#606060',
                              borderRightColor: '#ffffff',
                              borderBottomColor: '#ffffff'
                            }}
                          />
                          <span>〜</span>
                          <input
                            type="time"
                            value={slot.close}
                            onChange={(e) => handleTimeChange(day.key, index, 'close', e.target.value)}
                            className="px-2 py-1"
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
                            type="button"
                            onClick={() => removeTimeSlot(day.key, index)}
                            className="px-2 py-1 text-white text-xs font-bold"
                            style={{
                              backgroundColor: '#804040',
                              border: '2px solid #000',
                              borderTopColor: '#c08080',
                              borderLeftColor: '#c08080',
                              borderRightColor: '#402020',
                              borderBottomColor: '#402020'
                            }}
                          >
                            削除
                          </button>
                        </div>
                      ))}
                      {dayHours.length === 0 && (
                        <p className="text-sm text-gray-500">定休日</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 text-white font-bold disabled:opacity-50"
                style={{
                  backgroundColor: '#008080',
                  border: '3px solid #000',
                  borderTopColor: '#40c0c0',
                  borderLeftColor: '#40c0c0',
                  borderRightColor: '#004040',
                  borderBottomColor: '#004040'
                }}
              >
                {loading ? '追加中...' : '追加'}
              </button>
              <button
                type="button"
                onClick={() => router.push('/')}
                className="flex-1 px-4 py-2 font-bold"
                style={{
                  backgroundColor: '#a0a0a0',
                  color: '#000000',
                  border: '3px solid #000',
                  borderTopColor: '#ffffff',
                  borderLeftColor: '#ffffff',
                  borderRightColor: '#606060',
                  borderBottomColor: '#606060'
                }}
              >
                キャンセル
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}