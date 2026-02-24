import { useEffect, useState } from 'react';
import { reservationStore, Reservation } from '../lib/reservationStore';

export function useReservations() {
  const [, forceUpdate] = useState({});

  useEffect(() => {
    const unsubscribe = reservationStore.subscribe(() => {
      forceUpdate({});
    });

    return unsubscribe;
  }, []);

  return {
    current: reservationStore.getCurrentReservation(),
    waiting: reservationStore.getWaitingReservations(),
    waitingCount: reservationStore.getWaitingCount(),
    addReservation: (name: string, duration: number) => reservationStore.addReservation(name, duration),
    startNext: () => reservationStore.startNextReservation(),
    completeCurrent: () => reservationStore.completeCurrentReservation(),
    getPosition: (id: string) => reservationStore.getPositionById(id),
    getEstimatedTime: (position: number) => reservationStore.getEstimatedTime(position),
    clearCompleted: () => reservationStore.clearCompleted(),
    reset: () => reservationStore.reset(),
  };
}
