package com.marketplace.model;
import jakarta.persistence.*; import jakarta.validation.constraints.*; import lombok.*; import java.time.Instant; import java.util.*;
@Entity @Table(name="products") @Data @Builder @NoArgsConstructor @AllArgsConstructor
public class Product {
  @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
  @ManyToOne(fetch=FetchType.LAZY) private Store store;
  @ManyToOne(fetch=FetchType.LAZY) private Category category;
  @NotBlank @Column(nullable=false) private String title;
  @Column(nullable=false, unique=true) private String slug;
  @Column(length=4000) private String description;
  @Min(0) private Double basePriceUSD;
  @Min(0) private Double salePriceUSD;
  @Builder.Default private String status = "active";
  @Builder.Default private Instant createdAt = Instant.now();
  @OneToMany(mappedBy="product", cascade=CascadeType.ALL, orphanRemoval=true)
  @Builder.Default private java.util.List<ProductVariant> variants = new java.util.ArrayList<>();
}