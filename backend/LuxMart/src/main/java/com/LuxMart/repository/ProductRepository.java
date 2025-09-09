package com.LuxMart.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.LuxMart.entity.ProductEntity;
import com.LuxMart.enums.ProductStatus;

public interface ProductRepository extends JpaRepository<ProductEntity,Long>{


boolean existsBySlug(String slug);

 List<ProductEntity> findByStoreId(Long id);

List<ProductEntity> findByCategoryId(Long categoryId);
//@Query("SELECT CASE WHEN COUNT(v)> 0 THEN true ELSE false END"+"FROM ProductVariantEntity v WHERE v.sku = :sku")
  //boolean existsByVariantsSku(@Param("sku")String sku);
  List<ProductEntity> findByStatus(ProductStatus status);
}
