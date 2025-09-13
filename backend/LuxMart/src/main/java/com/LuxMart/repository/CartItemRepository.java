package com.LuxMart.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.LuxMart.entity.CartItemEntity;

public interface CartItemRepository extends JpaRepository< CartItemEntity, Long> {

    Optional<CartItemEntity> findByCartIdAndProductId(Long cartId, Long productId);

    List<CartItemEntity> findByCartId(Long cartId);

    void deleteByCartIdAndProductId(Long cartId, Long productId);

    long countByCartId(Long cartId);
    
}
