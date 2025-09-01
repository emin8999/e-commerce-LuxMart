package com.example.marketplace.entity;
import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

@Entity @Getter @Setter
public class ExchangeRate {
  @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;
  private String currency; // USD, AZN, EUR, TRY
  private Double rateToUSD; // USD=1, AZN ~0.588 (or store inverse, handled in service)
  private Instant updatedAt;
}
