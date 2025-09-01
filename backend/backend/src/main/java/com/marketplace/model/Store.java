package com.marketplace.model;
import jakarta.persistence.*; import jakarta.validation.constraints.*; import lombok.*; import java.time.Instant;
@Entity @Table(name="stores") @Data @Builder @NoArgsConstructor @AllArgsConstructor
public class Store {
  @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
  @NotBlank @Column(nullable=false) private String name;
  private String slug; private String logo;
  @ManyToOne(fetch=FetchType.LAZY) private User owner;
  @Builder.Default private Instant createdAt = Instant.now();
}