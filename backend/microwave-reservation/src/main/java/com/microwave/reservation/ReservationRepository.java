package com.microwave.reservation;

import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDateTime;

public interface ReservationRepository extends JpaRepository<Reservation, Long>{

  Reservation findFirstByStatusOrderByCreatedAtAsc(String status);

  void deleteByCreatedAtBetween(LocalDateTime start, LocalDateTime end);
}
