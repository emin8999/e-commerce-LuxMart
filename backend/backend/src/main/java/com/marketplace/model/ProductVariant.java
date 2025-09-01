package com.marketplace.model;
import jakarta.persistence.*; import jakarta.validation.constraints.*; import lombok.*;
@Entity @Table(name="product_variants") @Data @Builder @NoArgsConstructor @AllArgsConstructor
public class ProductVariant {
  @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
  @ManyToOne(fetch=FetchType.LAZY) private Product product;
  private String size;
  @Min(0) private Integer stock;
  @Min(0) private Double basePriceUSD;
  @Min(0) private Double salePriceUSD;
  @NotBlank @Column(unique=true) private String sku;
}