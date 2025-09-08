package com.LuxMart.dto.responseDto.product;


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
public class ProductVariantResponseDto {

    private Long id;
    private String sku;
    private String size;
    private Integer stockQuantity;
   
}
