package com.example.marketplace.entity;
import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

@Entity @Getter @Setter
public class Review {
  @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;
  @ManyToOne(fetch=FetchType.LAZY) private User user;
  @ManyToOne(fetch=FetchType.LAZY) private Product product;
  private Integer rating; // 1..5
  @Column(length=2000) private String text;
  private Boolean approved = false;
  private Instant createdAt = Instant.now();
}
