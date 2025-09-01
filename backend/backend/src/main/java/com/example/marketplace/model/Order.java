package com.example.marketplace.model;

import jakarta.persistence.*;
import lombok.*;
import java.util.*;

@Entity @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
@Table(name="orders")
public class Order {
  @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;
  private String userEmail;
  private String paymentMethod; // online, cod
  private String currency; // USD/AZN/EUR/TRY
  private double subtotal;
  private double discount;
  private double shipping;
  private double total;
  private String status; // pending/paid/failed/delivered
  @OneToMany(mappedBy="order", cascade=CascadeType.ALL, orphanRemoval=true)
  private List<OrderItem> items = new ArrayList<>();
}
