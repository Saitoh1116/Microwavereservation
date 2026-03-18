package com.microwave.reservation;

import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDateTime;
import org.springframework.transaction.annotation.Transactional;

public interface ReservationRepository extends JpaRepository<Reservation, Long>{
  
  Reservation findFirstByStatusOrderByCreatedAtAsc(String status);
  @Transactional
  void deleteByCreatedAtBetween(LocalDateTime start, LocalDateTime end);
}
