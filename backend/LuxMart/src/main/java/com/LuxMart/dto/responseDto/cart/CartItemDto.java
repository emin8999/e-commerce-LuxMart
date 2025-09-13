package com.LuxMart.dto.responseDto.cart;

import java.math.BigDecimal;

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
public class CartItemDto {

    private Long id;
    private Long productId;
    private String productTitle;
    private String productSlug;
    private String size;
    private int quantity;
    private BigDecimal unitPrice;
    private BigDecimal totalPrice;

}
