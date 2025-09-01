package com.example.marketplace.controller;

import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/cart")
public class CartController {
  // Price calculation stub (backend should calculate coupon and totals)
  @PostMapping("/price")
  public Map<String,Object> price(@RequestBody Map<String,Object> req){
    List<Map<String,Object>> items = (List<Map<String,Object>>) req.getOrDefault("items", List.of());
    double subtotal = 0;
    for (Map<String,Object> it : items){
      double usd = ((Number)it.getOrDefault("usd", 0)).doubleValue();
      int qty = ((Number)it.getOrDefault("qty", 1)).intValue();
      subtotal += usd * qty;
    }
    String couponType = (String) req.getOrDefault("couponType", null);
    Double couponValue = (Double) req.getOrDefault("couponValue", 0.0);
    double discount = 0;
    if ("PERCENT".equals(couponType)) discount = subtotal * (couponValue/100.0);
    if ("FIXED".equals(couponType)) discount = couponValue;
    double shipping = ((Number)req.getOrDefault("shipping", 0)).doubleValue();
    double total = Math.max(0, subtotal - discount + shipping);
    return Map.of("subtotal", subtotal, "discount", discount, "shipping", shipping, "total", total);
  }
}
