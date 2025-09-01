package com.marketplace.model;
import jakarta.persistence.*; import jakarta.validation.constraints.*; import lombok.*;
@Entity @Table(name="categories") @Data @Builder @NoArgsConstructor @AllArgsConstructor
public class Category {
  @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
  @NotBlank @Column(nullable=false) private String name;
  @NotBlank @Column(nullable=false, unique=true) private String slug;
  @ManyToOne(fetch=FetchType.LAZY) private Category parent;
  @Builder.Default private boolean active = true;
}