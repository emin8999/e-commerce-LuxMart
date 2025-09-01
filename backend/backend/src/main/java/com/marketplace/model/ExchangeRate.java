package com.marketplace.model;
import jakarta.persistence.*; import jakarta.validation.constraints.*; import lombok.*; import java.time.Instant;
@Entity @Table(name="exchange_rates") @Data @Builder @NoArgsConstructor @AllArgsConstructor
public class ExchangeRate {
  @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
  @Builder.Default private String baseCurrency = "USD";
  @NotBlank private String targetCurrency;
  @PositiveOrZero private Double rate;
  @Builder.Default private Instant updatedAt = Instant.now();
}