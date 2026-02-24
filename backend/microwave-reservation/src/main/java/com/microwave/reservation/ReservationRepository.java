package com.microwave.reservation;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ReservationRepository extends JpaRepository<Reservation, Long>{

  Reservation findFirstByStatusOrderByCreatedAtAsc(String status);
}
