package com.example.marketplace.entity;
import jakarta.persistence.*;
import lombok.*;

@Entity @Getter @Setter
public class ProductVariant {
  @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;
  @ManyToOne(fetch=FetchType.LAZY) private Product product;
  private String size; // S, M, L, XL
  private Integer stock;
  private String code; // unique ID
  private Double salePriceUSD; // nullable
}
