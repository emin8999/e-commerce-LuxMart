package com.LuxMart.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.LuxMart.entity.ProductVariantEntity;

public interface ProductVariantRepository extends JpaRepository<ProductVariantEntity,Long>{

}
