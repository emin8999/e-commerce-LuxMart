package com.example.marketplace.entity;
import jakarta.persistence.*;
import lombok.*;

@Entity @Getter @Setter
public class Store {
  @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;
  private String name;
  private boolean active = true;
  @ManyToOne(fetch=FetchType.LAZY) private User owner;
}
