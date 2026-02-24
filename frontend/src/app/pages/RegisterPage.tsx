import { useState } from 'react';
import { Button } from '../components/ui/button';
import { useReservations } from '../hooks/useReservations';
import { useNavigate, useSearchParams } from 'react-router-dom';

const DURATIONS = [
  { value: 1, label: '1分' },
  { value: 3, label: '3分' },
  { value: 5, label: '5分' },
];

function isWithinAcceptanceHours(): boolean {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const totalMinutes = hours * 60 + minutes;
  
  const startMinutes = 8 * 60 + 30; // 8:30
  const endMinutes = 12 * 60 + 30; // 12:30
  
  return totalMinutes >= startMinutes && totalMinutes <= endMinutes;
}

export function RegisterPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { addReservation, current, waiting } = useReservations();
  
  const [selectedDuration, setSelectedDuration] = useState<number | null>(null);
  const [name, setName] = useState('');
  
  const urlToken = searchParams.get('token');
  //今日の正解トークンを作る
  const jstNow = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Tokyo"})
  );

  const today = 
    jstNow.getFullYear() +
    "-" +
    String(jstNow.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(jstNow.getDate()).padStart(2, "0");

  const expectedToken = today; //btoa(today + "microwave");

  //トークンが一致しているか
  const hasValidAccess = urlToken === expectedToken;

  //テスト用
  const isAcceptanceTime = true;

  const handleSubmit = async () => {

    if (!selectedDuration || !name.trim()) {
      alert("入力不足");
      return;
    }
    

    const res = await fetch("https://api.mokichi-flashcard.com/api/reservations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name: name.trim(),
        duration: selectedDuration
      })
    });

   if (!res.ok) {
      alert("API失敗: " + res.status);
      return;
    }

    const saved = await res.json();
    navigate(`/register/complete?id=${saved.id}`);
  };

  if(!hasValidAccess){
    return(
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <h1 className="text-4xl mb-6">電子レンジ予約!</h1>
          <div className="bg-gray-100 border-2 border-gray-300 rounded-lg p-8">
            <p className="text-2xl text-gray-700">
              本日のQRコードからアクセスしてください
            </p>
          </div>
        </div>
      </div>
    );
  }



  if (!isAcceptanceTime) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <h1 className="text-4xl mb-6">電子レンジ予約</h1>
          <div className="bg-gray-100 border-2 border-gray-300 rounded-lg p-8">
            <p className="text-2xl text-gray-700">受付時間外です</p>
            <p className="text-lg text-gray-600 mt-4">受付時間：8:30〜12:30</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-md mx-auto pt-8">
        <h1 className="text-4xl mb-8 text-center">電子レンジ予約</h1>
        
        <div className="mb-8">
          <label className="block text-xl mb-3 text-gray-700">お名前</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 text-2xl border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            placeholder="お名前を入力"
          />
        </div>

        <div className="mb-8">
          <label className="block text-xl mb-4 text-gray-700">利用時間を選択してください</label>
          <div className="space-y-4">
            {DURATIONS.map((duration) => (
              <button
                key={duration.value}
                onClick={() => setSelectedDuration(duration.value)}
                className={`w-full py-6 text-3xl rounded-lg border-4 transition-all ${
                  selectedDuration === duration.value
                    ? 'bg-blue-500 text-white border-blue-600'
                    : 'bg-white text-gray-800 border-gray-300 hover:border-blue-400'
                }`}
              >
                {duration.label}
              </button>
            ))}
          </div>
        </div>

        <Button
          onClick={handleSubmit}
          disabled={!selectedDuration || !name.trim()}
          className="w-full py-8 text-3xl rounded-lg disabled:opacity-50 disabled:cursor-not-allowed bg-green-600 hover:bg-green-700 text-white"
        >
          予約する
        </Button>

        {(current || waiting.length > 0) && (
          <div className="mt-6 text-center text-gray-600">
            <p className="text-lg">現在の待ち人数: {waiting.length}人</p>
          </div>
        )}
      </div>
    </div>
  );
}
