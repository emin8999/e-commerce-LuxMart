package com.example.marketplace.controller;

import com.example.marketplace.model.ExchangeRate;
import com.example.marketplace.repository.ExchangeRateRepository;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/exchange-rate")
public class ExchangeRateController {
  private final ExchangeRateRepository repo;
  public ExchangeRateController(ExchangeRateRepository repo){ this.repo = repo; }

  @GetMapping
  public Map<String, Double> getRates(){
    Map<String, Double> map = new HashMap<>();
    repo.findAll().forEach(r -> map.put(r.getCurrency(), r.getRate()));
    if (!map.containsKey("USD")) map.put("USD",1.0);
    return map;
  }

  @PutMapping
  public void setRate(@RequestParam String currency, @RequestParam double rate){
    repo.save(ExchangeRate.builder().currency(currency).rate(rate).build());
  }
}
