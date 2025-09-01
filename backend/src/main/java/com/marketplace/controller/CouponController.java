package com.marketplace.controller;

import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/coupon")
public class CouponController {

  public record CouponRequest(String code, double subtotalUSD){}
  public record CouponResult(boolean valid, double percent){}

  @PostMapping("/validate")
  public CouponResult validate(@RequestBody CouponRequest req){
    if(req.code()==null) return new CouponResult(false,0);
    String code = req.code().trim().toUpperCase();
    return switch (code){
      case "SALE10" -> new CouponResult(true, 10);
      case "SALE15" -> new CouponResult(true, 15);
      default -> new CouponResult(false, 0);
    };
  }
}
