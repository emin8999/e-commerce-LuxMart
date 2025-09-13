package com.LuxMart.dto.requestDto.cart;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
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
public class AddToCartRequest {


    @NotNull(message = "Product ID is required")
    private Long productId;

    private String size;
    
    @Min(value = 1, message = "Quantity must be at least 1")
    private int quantity = 1;

}
