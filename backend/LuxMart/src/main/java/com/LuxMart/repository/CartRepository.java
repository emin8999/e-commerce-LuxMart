package com.LuxMart.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.LuxMart.entity.CartEntity;

public interface CartRepository extends JpaRepository<CartEntity,Long > {

   Optional<CartEntity> findByUserId(Long userId);

    boolean existsByUserId(Long userId);
    
    void deleteByUserId(Long userId);
    
}
