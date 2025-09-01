package com.example.marketplace.repository;
import com.example.marketplace.model.ExchangeRate;
import org.springframework.data.jpa.repository.JpaRepository;
public interface ExchangeRateRepository extends JpaRepository<ExchangeRate, String> {}