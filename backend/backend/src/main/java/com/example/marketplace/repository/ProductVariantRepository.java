package com.example.marketplace.repository;
import com.example.marketplace.model.ProductVariant;
import org.springframework.data.jpa.repository.JpaRepository;
public interface ProductVariantRepository extends JpaRepository<ProductVariant, Long> {}