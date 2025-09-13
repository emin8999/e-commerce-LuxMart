package com.LuxMart.service.impl;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.LuxMart.dto.requestDto.cart.AddToCartRequest;
import com.LuxMart.dto.responseDto.cart.CartItemDto;
import com.LuxMart.dto.responseDto.cart.CartResponse;
import com.LuxMart.entity.CartEntity;
import com.LuxMart.entity.CartItemEntity;
import com.LuxMart.entity.ProductEntity;
import com.LuxMart.entity.UserEntity;
import com.LuxMart.mapper.CartMapper;
import com.LuxMart.repository.CartItemRepository;
import com.LuxMart.repository.CartRepository;
import com.LuxMart.repository.ProductRepository;
import com.LuxMart.repository.UserRepository;
import com.LuxMart.service.CartService;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class CartServiceImpl implements CartService {

     private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final CartMapper cartMapper;

    @Transactional
    public CartResponse addToCart(Long userId, AddToCartRequest request) {
        log.info("Adding product {} to cart for user {}", request.getProductId(), userId);
        
        UserEntity user = userRepository.findById(userId)
            .orElseThrow(() -> new EntityNotFoundException("User not found with id: " + userId));
            
        ProductEntity product = productRepository.findById(request.getProductId())
            .orElseThrow(() -> new EntityNotFoundException("Product not found with id: " + request.getProductId()));
            
       
        CartEntity cart = cartRepository.findByUserId(userId)
            .orElseGet(() -> createNewCart(user));
            
        Optional<CartItemEntity> existingCartItem = cart.getCartItems().stream()
            .filter(item -> item.getProduct().getId().equals(request.getProductId()) 
                         && item.getSize().equals(request.getSize()))
            .findFirst();
            
        CartItemEntity cartItem;
        if (existingCartItem.isPresent()) {
        
            cartItem = existingCartItem.get();
            cartItem.setQuantity(cartItem.getQuantity() + request.getQuantity());
            cartItem.setUpdatedAt(LocalDateTime.now());
            log.info("Updated existing cart item quantity to {}", cartItem.getQuantity());
        } else {
          
            cartItem = CartItemEntity.builder()
                .cart(cart)
                .product(product)
                .quantity(request.getQuantity())
                .size(request.getSize())
                .unitPrice(product.getBasePriceUSD()) 
                .build();
            
            cart.getCartItems().add(cartItem);
            log.info("Created new cart item for product {}", product.getId());
        }
        
    
        cartItemRepository.save(cartItem);
        CartEntity savedCart = cartRepository.save(cart);
        
       
        return buildCartResponse(savedCart);
    }
    
    private CartEntity createNewCart(UserEntity user) {
        CartEntity newCart = CartEntity.builder()
            .user(user)
            .cartItems(new ArrayList<>())
            .build();
        return cartRepository.save(newCart);
    }
    
    private CartResponse buildCartResponse(CartEntity cart) {
       
        List<CartItemDto> cartItemDtos = cart.getCartItems().stream()
            .map(item -> {
                CartItemDto dto = cartMapper.toCartItemDto(item);
              
                dto.setTotalPrice(dto.getUnitPrice().multiply(BigDecimal.valueOf(dto.getQuantity())));
                return dto;
            })
            .collect(Collectors.toList());
            
        BigDecimal totalPrice = cartItemDtos.stream()
            .map(CartItemDto::getTotalPrice)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
            
        int totalItemsCount = cartItemDtos.stream()
            .mapToInt(CartItemDto::getQuantity)
            .sum();
            
        CartResponse response = cartMapper.toCartResponse(cart, cartItemDtos);
        
        response.setItems(cartItemDtos);
        response.setTotalPrice(totalPrice);
        response.setTotalItemsCount(totalItemsCount);
        
        return response;
    }


    @Override
    @Transactional(readOnly = true)
    public CartResponse getCart(Long userId) {
    Optional<CartEntity> optionalCart = cartRepository.findByUserId(userId);

    if (optionalCart.isEmpty()) {
        return CartResponse.builder()
                .cartId(null)
                .userId(userId)
                .items(new ArrayList<>())
                .totalPrice(BigDecimal.ZERO)
                .totalItemsCount(0)
                .build();
    }
    return buildCartResponse(optionalCart.get());
    }
}

