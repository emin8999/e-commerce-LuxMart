package com.example.marketplace.entity;
import jakarta.persistence.*;
import lombok.*;

@Entity @Getter @Setter
public class ShippingConfig {
  @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;
  private Double shippingUSD; // admin-controlled base shipping price in USD
}
