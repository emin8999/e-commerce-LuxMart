package com.example.marketplace.repository;
import com.example.marketplace.model.Store;
import org.springframework.data.jpa.repository.JpaRepository;
public interface StoreRepository extends JpaRepository<Store, Long> {}