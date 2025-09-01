package com.example.marketplace.controller;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
@RestController @RequestMapping("/api/admin")
public class AdminController {
  private double shippingUSD = 5.0;
  private final java.util.Map<String,Double> rates = new java.util.concurrent.ConcurrentHashMap<>(Map.of("USD",1.0,"AZN",1.7,"EUR",1.09,"TRY",0.03));
  @GetMapping("/shipping") public Map<String,Object> getShip(){ return Map.of("shippingUSD", shippingUSD); }
  @PutMapping("/shipping") public Map<String,Object> setShip(@RequestBody Map<String,Object> body){
    shippingUSD = ((Number)body.getOrDefault("shippingUSD",5.0)).doubleValue();
    return Map.of("ok", true, "shippingUSD", shippingUSD);
  }
  @GetMapping("/rates") public Map<String,Double> getRates(){ return rates; }
  @PutMapping("/rates/{currency}") public Map<String,Object> setRate(@PathVariable String currency, @RequestBody Map<String,Object> body){
    rates.put(currency, ((Number)body.getOrDefault("value",1.0)).doubleValue());
    return Map.of("ok", true, "currency", currency, "value", rates.get(currency));
  }
}
