package com.example.marketplace.model;

import jakarta.persistence.*;
import lombok.*;

@Entity @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ExchangeRate {
  @Id
  private String currency; // USD, AZN, EUR, TRY
  private double rate; // relative to USD
}
