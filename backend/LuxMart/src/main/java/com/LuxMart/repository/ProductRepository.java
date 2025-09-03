package com.LuxMart.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.LuxMart.entity.ProductEntity;

public interface ProductRepository extends JpaRepository<ProductEntity,Long>{

}
