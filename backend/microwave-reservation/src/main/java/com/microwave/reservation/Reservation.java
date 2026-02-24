package com.microwave.reservation;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "reservations")
public class Reservation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    private int duration;

    private LocalDateTime createdAt;

    private LocalDateTime startTime;

    private String status;

    public Reservation() {}

    public Reservation(String name, int duration) {
        this.name = name;
        this.duration = duration;
        this.createdAt = LocalDateTime.now();
        this.status = "WAITING";
    }

    // ===== getter =====

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public int getDuration() {
        return duration;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getStartTime() {
        return startTime;
    }

    public String getStatus() {
        return status;
    }

    // ===== setter =====

    public void setName(String name) {
        this.name = name;
    }

    public void setDuration(int duration) {
        this.duration = duration;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public void setStartTime(LocalDateTime startTime) {
        this.startTime = startTime;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}

