import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import { CheckCircle } from 'lucide-react';
import { useReservations } from '../hooks/useReservations';

export function CompletePage() {
  const [searchParams] = useSearchParams();
  const reservationId = searchParams.get('id');
  const { getPosition, getEstimatedTime, waitingCount } = useReservations();
  
  const [position, setPosition] = useState(0);
  const [estimatedTime, setEstimatedTime] = useState<Date | null>(null);

  useEffect(() => {
    if (!reservationId) return;
    
    const updateInfo = () => {
      const pos = getPosition(reservationId);
      setPosition(pos);
      
      if (pos > 0) {
        setEstimatedTime(getEstimatedTime(pos));
      }
    };

    updateInfo();
    const interval = setInterval(updateInfo, 1000);
    
    return () => clearInterval(interval);
  }, [reservationId, getPosition, getEstimatedTime]);

  if (!reservationId) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-2xl text-gray-600">予約情報が見つかりません</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-md mx-auto pt-12">
        <div className="text-center mb-12">
          <CheckCircle className="w-24 h-24 text-green-500 mx-auto mb-6" />
          <h1 className="text-4xl mb-8">予約が完了しました</h1>
        </div>

        <div className="bg-blue-50 border-4 border-blue-200 rounded-xl p-8 mb-8">
          <div className="text-center mb-6">
            <p className="text-xl text-gray-700 mb-2">あなたの順番</p>
            <p className="text-6xl text-blue-600">
              {position > 0 ? `${position}番目` : '使用中'}
            </p>
          </div>
          
          {estimatedTime && position > 0 && (
            <div className="text-center">
              <p className="text-xl text-gray-700 mb-2">目安時間</p>
              <p className="text-3xl text-gray-800">
                {estimatedTime.getHours()}:{estimatedTime.getMinutes().toString().padStart(2, '0')}ごろ
              </p>
            </div>
          )}
        </div>

        <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-6 text-center">
          <p className="text-xl text-gray-700 mb-2">現在の待ち人数</p>
          <p className="text-4xl text-gray-800">{waitingCount}人</p>
        </div>

        <div className="mt-8 text-center">
          <p className="text-lg text-gray-600">
            タブレット画面で<br />
            順番をご確認ください
          </p>
        </div>
      </div>
    </div>
  );
}
