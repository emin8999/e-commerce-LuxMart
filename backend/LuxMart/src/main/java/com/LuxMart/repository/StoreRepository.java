package com.LuxMart.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.LuxMart.entity.StoreEntity;


@Repository
public interface StoreRepository  extends JpaRepository<StoreEntity,Long> {

    Optional<StoreEntity> findStoreEntitiesByEmail(String email);

    boolean existsByEmail(String email);

    Optional<StoreEntity> findByEmail(String email);
    
    boolean existsBySlug(String slug);

     Optional<StoreEntity> findBySlug(String slug);

  

}
