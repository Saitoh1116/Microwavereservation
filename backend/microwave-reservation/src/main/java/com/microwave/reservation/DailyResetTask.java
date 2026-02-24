package com.microwave.reservation;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class DailyResetTask {

  private final ReservationRepository repo;

  public DailyResetTask(ReservationRepository repo) {
    this.repo = repo;
  }

  // 毎日0:00に全削除
  @Scheduled(cron = "0 0 0 * * *")
  public void resetDaily() {
    repo.deleteAll();
    System.out.println("=== Daily reset executed ===");
  }
}

