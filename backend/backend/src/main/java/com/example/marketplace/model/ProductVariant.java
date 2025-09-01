package com.example.marketplace.model;

import jakarta.persistence.*;
import lombok.*;

@Entity @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ProductVariant {
  @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;
  private String variantId; // unique identifier like PRD-0001-M
  private String size; // S,M,L,XL
  private int stock;
  private Double salePriceUsd; // optional per variant
  @ManyToOne private Product product;
}
