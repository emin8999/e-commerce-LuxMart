package com.example.marketplace.model;

import jakarta.persistence.*;
import lombok.*;

@Entity @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class OrderItem {
  @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;
  private Long productIdRef;
  private Long variantIdRef;
  private String title;
  private String size;
  private int qty;
  private double unitPriceUsd; // snapshot USD
  private double oldUnitPriceUsd; // snapshot USD old price
  private double discountUsd; // snapshot applied discount portion
  @ManyToOne private Order order;
  private Long storeIdRef;
}
