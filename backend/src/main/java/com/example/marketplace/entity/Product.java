package com.example.marketplace.entity;
import jakarta.persistence.*;
import lombok.*;
import java.util.List;

@Entity @Getter @Setter
public class Product {
  @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;
  @ManyToOne(fetch=FetchType.LAZY) private Store store;
  @ManyToOne(fetch=FetchType.LAZY) private Category category;
  private String title;
  @Column(length=5000) private String description;
  private Double basePriceUSD;
  private boolean active = true;
}
