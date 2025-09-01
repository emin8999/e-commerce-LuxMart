package com.example.marketplace.service;

import com.example.marketplace.model.ExchangeRate;
import com.example.marketplace.repository.ExchangeRateRepository;
import org.springframework.stereotype.Service;
import java.util.HashMap;
import java.util.Map;

@Service
public class CurrencyService {
  private final ExchangeRateRepository repo;
  public CurrencyService(ExchangeRateRepository repo){ this.repo = repo; }

  public Map<String, Double> getRates(){
    Map<String, Double> rates = new HashMap<>();
    repo.findAll().forEach(r -> rates.put(r.getCurrency(), r.getRate()));
    if (!rates.containsKey("USD")) rates.put("USD", 1.0);
    return rates;
  }
}
