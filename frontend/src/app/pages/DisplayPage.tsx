import { useEffect, useMemo, useState } from "react";
import { Clock } from "lucide-react";
import { Button } from "../components/ui/button";
import { QRCodeSVG } from "qrcode.react";

/**
 * サーバーから返る Reservation の最小形
 * （startTime はまだ無い前提。後で追加したら使える）
 */
type Reservation = {
  id: number;
  name: string;
  duration: number; // 分
  status?: "WAITING" | "USING" | "DONE";
  createdAt?: string; // ISO文字列（あってもなくてもOK）
  startTime?: string; // まだ無いなら undefined
};

const API_BASE = "https://api.mokichi-flashcard.com";
const FRONT_BASE = window.location.origin;

// 12:15開始（Displayの開始判定用）
function isStartedTime(): boolean {
  const now = new Date();
  const start = new Date();
  start.setHours(12, 15, 0, 0);
  return now >= start;
}

function isReservationTime(): boolean{
  const now = new Date();

  const start = new Date();
  start.setHours(8, 30, 0, 0);

  const end = new Date();
  end.setHours(17, 30, 0, 0);
  
  return now >= start && now <= end;
}

export function DisplayPage() {
  const [hasStarted, setHasStarted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // サーバー状態
  const [current, setCurrent] = useState<Reservation | null>(null);
  const [waiting, setWaiting] = useState<Reservation[]>([]);

  const [remain, setRemain] = useState<number | null>(null);

  // UI表示用（予定時刻計算用）
  const estimatedTimes = useMemo(() => {
    // 1人目の基準時刻：今 or 12:15（まだ12:15前なら）
    let base = Date.now();
    if (!current && waiting.length > 0) {
      const now = new Date();
      const start = new Date(now);
      start.setHours(12, 15, 0, 0);
      if (now.getTime() < start.getTime()) base = start.getTime();
    }

    // current に startTime があるなら、その終了から積む（無ければ「いま」基準）
    if (current?.startTime) {
      const startMs = new Date(current.startTime).getTime();
      base = startMs + current.duration * 60 * 1000;
    }

    const times: Date[] = [];
    let acc = 0;
    for (const r of waiting) {
      const t = new Date(base + acc * 60 * 1000);
      times.push(t);
      acc += r.duration;
    }
    return times;
  }, [current, waiting]);

  // ----- API helpers -----
  const loadCurrent = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/reservations/current`);
      if (!res.ok) return;
      const data = await res.json();
      // サーバーが null を返すケースがあるのでケア
      setCurrent(data && data.id ? data : null);
    } catch (e) {
      console.error("loadCurrent failed", e);
    }
  };

  const loadWaiting = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/reservations/waiting`);
      if (!res.ok) return;
      const data = await res.json();
      setWaiting(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("loadWaiting failed", e);
    }
  };

  const startNext = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/reservations/start`, {
        method: "POST",
      });
      // startは「次がいない」なら null 返す想定
      if (!res.ok) return;
      const started = await res.json().catch(() => null);
      // すぐ反映させたいので再読込
      await loadCurrent();
      await loadWaiting();
      return started;
    } catch (e) {
      console.error("startNext failed", e);
    }
  };

  const completeCurrent = async () => {
    if (!current) return;
    try {
      const res = await fetch(
        `${API_BASE}/api/reservations/${current.id}/complete`,
        { method: "POST" }
      );
      if (!res.ok) return;
      // 完了したら再読込
      await loadCurrent();
      await loadWaiting();
    } catch (e) {
      console.error("completeCurrent failed", e);
    }
  };

  // ---- リセット ----
  const resetAll = async () => {
    const pw = prompt("管理者パスワードを入力してください");

    if(!pw) return;

    try{
      await fetch(`${API_BASE}/api/reservations/reset?password=${pw}`,{
        method: "POST",
      });

      await loadCurrent();
      await loadWaiting();
    } catch(e){
      alert("リセットに失敗しました");
    }
  }

  const today = new Date().toLocaleDateString("sv-SE");

  // ----- 時刻監視（12:15になったら開始） -----
  useEffect(() => {
    const tick = () => {
      setHasStarted(isStartedTime());
      setIsOpen(isReservationTime());
    };

    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, []);


  // ----- 3秒ごとにサーバー状態を取得（表示はこれだけで更新される） -----
  useEffect(() => {
    const loadAll = async () => {
      await loadCurrent();
      await loadWaiting();
    };

    loadAll();
    const timer = setInterval(loadAll, 3000);
    return () => clearInterval(timer);
  }, []);

  // ----- 開始後：currentがいなくて待ちがあるなら自動でstart -----
  useEffect(() => {
    if (!hasStarted) return;
    if (!current && waiting.length > 0) {
      // 無限ループ防止：start叩いても3秒ポーリングで反映されるので、ここは一発だけでOK
      startNext();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasStarted, current?.id, waiting.length]);


  useEffect(() => {
    if(!current?.startTime) return;

    const timer = setInterval(() => {
      const start = new Date(current.startTime!).getTime();
      const end = start + current.duration * 60 * 1000;
      const r = Math.floor((end - Date.now()) / 1000);
      setRemain(r > 0 ? r : 0);
    }, 1000);

    return () => clearInterval(timer);
  }, [current]);

  const hasNobody = !current && waiting.length === 0;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* ヘッダー */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-5xl">電子レンジ予約!</h1>
          <div className="flex gap-4">
            {/* 今はテストなので「完了済み削除/リセット」は未実装（必要ならAPI足して繋ぐ） */}
            <Button 
              onClick={resetAll}
              variant="destructive"
              className="text-lg px-6 py-3"
            >
            リセット
            </Button>
          </div>
        </div>

        {/* QRコード */}
        <div style={{
          display: "flex",
          justifyContent: "center",
          marginTop: "40px",
          marginBottom: "40px",
        }}>
          {isOpen ? (
           <QRCodeSVG value={`${FRONT_BASE}/register?token=${today}`}size={320} />
          ) : (
            <div style={{ textAlign: "center"}}>
              <p className="text-3xl text-gray-400">
                予約受付時間外です
              </p>
              <p className="text-xl text-gray-500 mt-2">
                受付時間: 8:30 ~ 12:30
              </p>
            </div>
          )}
        </div>

        {/* 現在使用中 */}
        {hasStarted && (
          <div className="bg-white rounded-2xl shadow-lg p-12 mb-8 border-4 border-gray-200">
            {current ? (
              <div>
                <h2 className="text-3xl text-gray-600 mb-6 text-center">
                  現在使用中
                </h2>

                <div className="text-center">
                  <p className="text-8xl mb-8">{current.name}</p>

                  {/* startTime未実装なので、カウントダウンは一旦表示だけ残す */}
                  <div className="flex items-center justify-center gap-4 mb-8">
                    <Clock className="w-16 h-16 text-blue-500" />
                    <p className="text-5xl text-gray-500">
                      残り {remain ?? 0} 秒
                    </p>
                  </div>

                  <p className="text-2xl text-gray-600">
                    利用時間: {current.duration}分
                  </p>
                </div>

                <div className="mt-8 text-center">
                  <Button
                    onClick={completeCurrent}
                    className="text-2xl px-12 py-6 bg-green-600 hover:bg-green-700"
                  >
                    完了
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <h2 className="text-4xl text-gray-400 mb-4">現在使用中: なし</h2>
                {waiting.length > 0 ? (
                  <Button
                    onClick={startNext}
                    className="text-2xl px-12 py-6 mt-6 bg-blue-600 hover:bg-blue-700"
                  >
                    次の人を開始
                  </Button>
                ) : (
                  <p className="text-3xl text-gray-500 mt-6">予約を受付中です</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* 順番リスト */}
        {waiting.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-8 border-4 border-gray-200">
            <h2 className="text-3xl mb-6 text-center text-gray-700">順番待ち</h2>
            <table className="w-full">
              <thead>
                <tr className="border-b-4 border-gray-300">
                  <th className="text-3xl text-left py-4 px-6 text-gray-700">
                    順番
                  </th>
                  <th className="text-3xl text-left py-4 px-6 text-gray-700">
                    名前
                  </th>
                  <th className="text-3xl text-left py-4 px-6 text-gray-700">
                    予定時間
                  </th>
                  <th className="text-3xl text-left py-4 px-6 text-gray-700">
                    利用時間
                  </th>
                </tr>
              </thead>
              <tbody>
                {waiting.map((r, index) => (
                  <tr key={r.id} className="border-b-2 border-gray-200">
                    <td className="text-4xl py-6 px-6">{index + 1}</td>
                    <td className="text-4xl py-6 px-6">{r.name}</td>
                    <td className="text-3xl py-6 px-6 text-gray-600">
                      {estimatedTimes[index]?.getHours()}:
                      {estimatedTimes[index]
                        ?.getMinutes()
                        .toString()
                        .padStart(2, "0")}
                      ごろ
                    </td>
                    <td className="text-3xl py-6 px-6 text-gray-600">
                      {r.duration}分
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 誰もいない */}
        {hasNobody && (
          <div className="bg-white rounded-2xl shadow-lg p-16 text-center border-4 border-gray-200">
            <p className="text-5xl text-gray-400 mb-6">予約を受付中です</p>
            <p className="text-2xl text-gray-500">QRコードから予約してください</p>
          </div>
        )}

        {/* 次の人 */}
        {current && waiting.length > 0 && (
          <div className="mt-8 bg-blue-50 rounded-xl p-6 text-center border-2 border-blue-200">
            <p className="text-2xl text-gray-700">
              次の人:{" "}
              <span className="font-bold text-3xl">{waiting[0].name}</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

