package com.example.marketplace.entity;
import jakarta.persistence.*;
import lombok.*;
import java.util.List;

@Entity @Getter @Setter
public class Category {
  @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;
  private String name;
  @ManyToOne(fetch=FetchType.LAZY) private Category parent;
}
