package com.marketplace.controller;

import org.springframework.web.bind.annotation.*;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/api/config")
public class ConfigController {

  private final Map<String, Double> rates = new ConcurrentHashMap<>(Map.of(
    "AZN",1.7,"EUR",0.92,"TRY",33.0
  ));
  private double shippingCost = 5.0;

  @GetMapping("/rates")
  public Map<String, Double> getRates(){ return rates; }

  @PostMapping("/rates")
  public Map<String, Double> setRates(@RequestBody Map<String, Double> newRates){
    rates.clear(); rates.putAll(newRates); return rates;
  }

  @GetMapping("/shipping")
  public Map<String, Double> getShipping(){ return Map.of("shippingCost", shippingCost); }

  @PostMapping("/shipping")
  public Map<String, Double> setShipping(@RequestBody Map<String, Double> body){
    shippingCost = body.getOrDefault("shippingCost", shippingCost);
    return Map.of("shippingCost", shippingCost);
  }
}
