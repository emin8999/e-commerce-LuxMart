package com.LuxMart.dto.responseDto.cart;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

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
public class CartResponse {

   private Long cartId;

    private Long userId;

    private List<CartItemDto> items;

    private BigDecimal totalPrice;

    private int totalItemsCount;

    private LocalDateTime updatedAt;

}
