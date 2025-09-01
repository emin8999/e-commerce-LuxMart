package com.example.marketplace.service;

import org.springframework.stereotype.Service;

@Service
public class PricingService {
  // Simple demo pipeline: Base -> (Sale?) -> Rule (not implemented) -> Coupon (handled separately)
  public double currentPriceUsd(double basePriceUsd, Double salePriceUsd) {
    if (salePriceUsd != null && salePriceUsd < basePriceUsd) return salePriceUsd;
    return basePriceUsd;
  }

  public double oldPriceUsd(double basePriceUsd, Double salePriceUsd) {
    if (salePriceUsd != null && salePriceUsd < basePriceUsd) return basePriceUsd;
    return basePriceUsd; // old equals base when no sale
  }
}
