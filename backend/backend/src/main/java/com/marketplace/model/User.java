package com.marketplace.model;
import jakarta.persistence.*; import jakarta.validation.constraints.*; import lombok.*; import java.time.Instant;
@Entity @Table(name="users") @Data @Builder @NoArgsConstructor @AllArgsConstructor
public class User {
  @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
  @Email @NotBlank @Column(nullable=false, unique=true) private String email;
  @NotBlank private String role; // CLIENT, STORE_OWNER, ADMIN
  private String name;
  @Builder.Default private Instant createdAt = Instant.now();
}