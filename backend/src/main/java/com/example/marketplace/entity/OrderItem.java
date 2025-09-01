package com.example.marketplace.entity;
import jakarta.persistence.*;
import lombok.*;

@Entity @Getter @Setter
public class OrderItem {
  @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;
  @ManyToOne(fetch=FetchType.LAZY) private Order order;
  @ManyToOne(fetch=FetchType.LAZY) private Store store;
  @ManyToOne(fetch=FetchType.LAZY) private Product product;
  @ManyToOne(fetch=FetchType.LAZY) private ProductVariant variant;
  private Integer qty;
  private Double unitPrice; // in order currency
  private Double oldUnitPrice; // for crossed old price, in order currency
}
