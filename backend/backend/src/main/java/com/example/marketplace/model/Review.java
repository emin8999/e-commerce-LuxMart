package com.example.marketplace.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.*;

@Entity @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Review {
  @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;
  private Long productIdRef;
  private String userEmail;
  private int rating; // 1..5
  @Column(length=2000) private String text;
  private boolean approved = false;
  private LocalDate createdAt = LocalDate.now();
}
