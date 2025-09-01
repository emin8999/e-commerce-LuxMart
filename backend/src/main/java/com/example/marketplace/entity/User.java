package com.example.marketplace.entity;
import jakarta.persistence.*;
import lombok.*;
import java.util.Set;

@Entity @Getter @Setter
public class User {
  @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;
  @Column(unique=true) private String email;
  private String password;
  private String name;
  @ElementCollection(fetch=FetchType.EAGER)
  private Set<String> roles; // CLIENT, STORE_OWNER, ADMIN
}
