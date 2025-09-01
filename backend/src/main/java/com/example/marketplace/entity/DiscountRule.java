package com.example.marketplace.entity;
import jakarta.persistence.*;
import lombok.*;

@Entity @Getter @Setter
public class DiscountRule {
  @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;
  private String scope; // PRODUCT, CATEGORY, STORE
  private Long refId;   // id of product/category/store
  private String type;  // PERCENT or FIXED
  private Double value;
  private Boolean stackWithSale = false;
}
