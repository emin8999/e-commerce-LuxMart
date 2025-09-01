package com.example.marketplace.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.*;

@Entity @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Coupon {
  @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;
  @Column(unique = true) private String code;
  public enum Type { PERCENT, FIXED }
  @Enumerated(EnumType.STRING) private Type type;
  private double value;
  private Double minSubtotal; // nullable
  private LocalDate startDate;
  private LocalDate endDate;
  private Integer usesLimit; // nullable
  private int usedCount;
  private boolean active = true;
}
