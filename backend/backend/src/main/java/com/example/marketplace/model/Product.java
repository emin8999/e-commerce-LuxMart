package com.example.marketplace.model;

import jakarta.persistence.*;
import lombok.*;
import java.util.*;

@Entity @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Product {
  @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;
  private String title;
  @Column(length=4000) private String description;
  private double basePriceUsd;
  private Double salePriceUsd; // nullable
  private String productId; // public unique identifier
  @ManyToOne private Store store;
  @ManyToOne private Category category;
  private boolean active = true;

  @OneToMany(mappedBy="product", cascade=CascadeType.ALL, orphanRemoval=true)
  private List<ProductVariant> variants = new ArrayList<>();
}
