package com.LuxMart.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.LuxMart.entity.CategoryEntity;

public interface CategoryRepository extends JpaRepository<CategoryEntity,Long> {

  Optional<CategoryEntity>findBySlug(String slug);
  
}
