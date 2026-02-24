export interface Reservation {
  id: string;
  name: string;
  duration: number; // 実際の利用時間（1, 3, 5）
  totalDuration: number; // バッファ込みの時間
  createdAt: number;
  startTime?: number;
  status: 'waiting' | 'using' | 'completed';
}

const STORAGE_KEY = 'microwave_reservations';
const CHANNEL_NAME = 'microwave_sync';

class ReservationStore {
  private channel: BroadcastChannel;
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.channel = new BroadcastChannel(CHANNEL_NAME);
    this.channel.onmessage = () => {
      this.notifyListeners();
    };
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener());
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private broadcast() {
    this.channel.postMessage({ type: 'update' });
  }

  getReservations(): Reservation[] {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    return JSON.parse(data);
  }

  private saveReservations(reservations: Reservation[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reservations));
    this.broadcast();
  }

  addReservation(name: string, duration: number): Reservation {
    const reservations = this.getReservations();
    const totalDuration = duration + 1; // バッファ1分追加
    
    const newReservation: Reservation = {
      id: Date.now().toString(),
      name,
      duration,
      totalDuration,
      createdAt: Date.now(),
      status: 'waiting',
    };

    reservations.push(newReservation);
    this.saveReservations(reservations);
    return newReservation;
  }

  startNextReservation() {
    const reservations = this.getReservations();
    const waiting = reservations.filter(r => r.status === 'waiting');
    const current = reservations.find(r => r.status === 'using');
    
    if (waiting.length > 0) {
      waiting[0].status = 'using';
      
      // 1人目の場合は12:15から開始
      if (!current) {
        const now = new Date();
        const startTime = new Date(now);
        startTime.setHours(12, 15, 0, 0);
        
        // 現在時刻が12:15以前なら12:15、以降なら現在時刻
        if (now.getTime() < startTime.getTime()) {
          waiting[0].startTime = startTime.getTime();
        } else {
          waiting[0].startTime = Date.now();
        }
      } else {
        waiting[0].startTime = Date.now();
      }
      
      this.saveReservations(reservations);
    }
  }

  completeCurrentReservation() {
    const reservations = this.getReservations();
    const current = reservations.find(r => r.status === 'using');
    
    if (current) {
      current.status = 'completed';
      this.saveReservations(reservations);
      
      // 次の人を自動的に開始
      setTimeout(() => {
        this.startNextReservation();
      }, 100);
    }
  }

  getCurrentReservation(): Reservation | null {
    const reservations = this.getReservations();
    return reservations.find(r => r.status === 'using') || null;
  }

  getWaitingReservations(): Reservation[] {
    const reservations = this.getReservations();
    return reservations.filter(r => r.status === 'waiting');
  }

  getWaitingCount(): number {
    return this.getWaitingReservations().length;
  }

  getPositionById(id: string): number {
    const waiting = this.getWaitingReservations();
    const index = waiting.findIndex(r => r.id === id);
    return index + 1; // 1-based
  }

  getEstimatedTime(position: number): Date {
    const current = this.getCurrentReservation();
    const waiting = this.getWaitingReservations();
    
    // 1人目の場合
    if (!current && position === 1) {
      const now = new Date();
      const startTime = new Date(now);
      startTime.setHours(12, 15, 0, 0);
      
      // 現在時刻が12:15以前なら12:15、以降なら現在時刻
      if (now.getTime() < startTime.getTime()) {
        return startTime;
      } else {
        return now;
      }
    }
    
    let baseTime = Date.now();
    let totalMinutes = 0;
    
    // 現在使用中の人がいない場合、1人目は12:15から
    if (!current && waiting.length > 0) {
      const now = new Date();
      const startTime = new Date(now);
      startTime.setHours(12, 15, 0, 0);
      
      if (now.getTime() < startTime.getTime()) {
        baseTime = startTime.getTime();
      }
    }
    
    // 現在使用中の人の残り時間
    if (current && current.startTime) {
      const elapsed = (Date.now() - current.startTime) / 1000 / 60;
      const remaining = Math.max(0, current.totalDuration - elapsed);
      totalMinutes += remaining;
    }
    
    // 自分より前の人の時間
    for (let i = 0; i < position - 1; i++) {
      if (waiting[i]) {
        totalMinutes += waiting[i].totalDuration;
      }
    }
    
    return new Date(baseTime + totalMinutes * 60 * 1000);
  }

  clearCompleted() {
    const reservations = this.getReservations();
    const active = reservations.filter(r => r.status !== 'completed');
    this.saveReservations(active);
  }

  reset() {
    this.saveReservations([]);
  }
}

export const reservationStore = new ReservationStore();