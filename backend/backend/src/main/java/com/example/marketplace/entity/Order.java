package com.example.marketplace.entity;
import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.util.List;

@Entity @Getter @Setter @Table(name="orders")
public class Order {
  @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;
  @ManyToOne(fetch=FetchType.LAZY) private User user;
  private String currency; // user-selected
  private Double subtotal;
  private Double shipping;
  private Double total;
  private String status; // pending, paid, failed, delivered
  private Instant createdAt = Instant.now();
}
