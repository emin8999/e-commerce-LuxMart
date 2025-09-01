package com.marketplace.controller;
import com.marketplace.model.ExchangeRate; import com.marketplace.repo.ExchangeRateRepository;
import org.springframework.web.bind.annotation.*; import java.util.*;
@RestController @RequestMapping("/api/config")
public class ConfigController {
  private final ExchangeRateRepository ratesRepo; private double shippingCost = 5.0;
  public ConfigController(ExchangeRateRepository ratesRepo){
    this.ratesRepo=ratesRepo;
    if(ratesRepo.findAll().isEmpty()){
      ratesRepo.save(ExchangeRate.builder().targetCurrency("AZN").rate(1.7).build());
      ratesRepo.save(ExchangeRate.builder().targetCurrency("EUR").rate(0.92).build());
      ratesRepo.save(ExchangeRate.builder().targetCurrency("TRY").rate(33.0).build());
    }
  }
  @GetMapping("/rates") public Map<String, Double> getRates(){ Map<String, Double> m=new LinkedHashMap<>(); for(ExchangeRate r: ratesRepo.findAll()) m.put(r.getTargetCurrency(), r.getRate()); return m; }
  @PostMapping("/rates") public Map<String, Double> setRates(@RequestBody Map<String, Double> body){
    body.forEach((k,v)->{ ExchangeRate r = ratesRepo.findByTargetCurrency(k); if(r==null) r=ExchangeRate.builder().targetCurrency(k).rate(v).build(); else r.setRate(v); ratesRepo.save(r); });
    return getRates();
  }
  @GetMapping("/shipping") public Map<String, Double> getShipping(){ return Map.of("shippingCost", shippingCost); }
  @PostMapping("/shipping") public Map<String, Double> setShipping(@RequestBody Map<String, Double> body){ shippingCost = body.getOrDefault("shippingCost", shippingCost); return Map.of("shippingCost", shippingCost); }
}