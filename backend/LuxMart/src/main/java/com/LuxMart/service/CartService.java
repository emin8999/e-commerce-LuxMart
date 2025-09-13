package com.LuxMart.service;

import com.LuxMart.dto.requestDto.cart.AddToCartRequest;
import com.LuxMart.dto.responseDto.cart.CartResponse;

public interface CartService {

    CartResponse addToCart(Long userId, AddToCartRequest request);

    CartResponse getCart(Long userId);

}
