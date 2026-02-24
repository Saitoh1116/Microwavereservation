package com.microwave.reservation;


import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class MicrowaveReservationApplication {

	public static void main(String[] args) {
		SpringApplication.run(MicrowaveReservationApplication.class, args);
	}

}
