package com.LuxMart.dto.responseDto.product;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import com.LuxMart.enums.ProductStatus;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class ProductResponseDto {

    private Long id;
    private String title;
    private String slug;
    private String description;
    private BigDecimal basePriceUSD;
    private BigDecimal salePriceUSD;
    private String imageUrl;
    private ProductStatus status;
    private Long storeId;
    private Long categoryId;
    private List<ProductVariantResponseDto>variants;
    private LocalDateTime createdAt;
    private LocalDateTime updateAt;

}
