package com.LuxMart.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.LuxMart.dto.requestDto.cart.AddToCartRequest;
import com.LuxMart.dto.responseDto.cart.CartResponse;
import com.LuxMart.service.CartService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
public class CartController {
    
    private final CartService cartService;
   
    @PostMapping("/add")
    public ResponseEntity<CartResponse> addToCart(
            @RequestHeader("User-Id") Long userId,
            @Valid @RequestBody AddToCartRequest request
    ) {
        CartResponse response = cartService.addToCart(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

     @GetMapping("/get")
    public ResponseEntity<CartResponse> getCart(
            @RequestHeader("User-Id") Long userId  
    ) {
        CartResponse response = cartService.getCart(userId);
        return ResponseEntity.ok(response);
    }


}
