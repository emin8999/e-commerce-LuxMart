package com.LuxMart.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.LuxMart.entity.ProductEntity;

public interface ProductRepository extends JpaRepository<ProductEntity,Long>{


boolean existsBySlug(String slug);

//@Query("SELECT CASE WHEN COUNT(v)> 0 THEN true ELSE false END"+"FROM ProductVariantEntity v WHERE v.sku = :sku")
  //boolean existsByVariantsSku(@Param("sku")String sku);

}
