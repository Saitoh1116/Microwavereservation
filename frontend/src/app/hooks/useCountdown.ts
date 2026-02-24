import { useEffect, useState } from 'react';

export function useCountdown(startTime: number | undefined, durationMinutes: number) {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (!startTime) {
      setRemaining(0);
      return;
    }

    const updateRemaining = () => {
      const elapsed = (Date.now() - startTime) / 1000;
      const totalSeconds = durationMinutes * 60;
      const remainingSeconds = Math.max(0, totalSeconds - elapsed);
      setRemaining(remainingSeconds);
    };

    updateRemaining();
    const interval = setInterval(updateRemaining, 100);

    return () => clearInterval(interval);
  }, [startTime, durationMinutes]);

  const minutes = Math.floor(remaining / 60);
  const seconds = Math.floor(remaining % 60);

  return {
    remaining,
    minutes,
    seconds,
    isFinished: remaining <= 0,
    formatted: `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`,
  };
}
