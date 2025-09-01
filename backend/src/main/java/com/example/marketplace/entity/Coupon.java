package com.example.marketplace.entity;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity @Getter @Setter
public class Coupon {
  @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;
  @Column(unique=true) private String code;
  private String type; // PERCENT or FIXED
  private Double value;
  private Double minSubtotalUSD;
  private LocalDate startDate;
  private LocalDate endDate;
  private Integer usesLimit;
  private Integer usedCount = 0;
  private Boolean allowOnDiscounted = false;
}
