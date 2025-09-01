package com.example.marketplace.controller;

import com.example.marketplace.model.Coupon;
import com.example.marketplace.repository.CouponRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/coupons")
public class CouponController {

  private final CouponRepository repo;

  public CouponController(CouponRepository repo) {
    this.repo = repo;
  }

  @PostMapping("/validate")
  public ResponseEntity<Map<String, Object>> validate(@RequestBody Map<String, Object> req) {
    // Безопасно достаём code
    Object raw = req.get("code");
    String code = raw == null ? "" : String.valueOf(raw).trim();

    Map<String, Object> resp = new HashMap<>();
    if (code.isEmpty()) {
      resp.put("valid", false);
      return ResponseEntity.ok(resp);
    }

    Optional<Coupon> opt = repo.findByCodeIgnoreCase(code);
    if (opt.isEmpty()) {
      resp.put("valid", false);
      return ResponseEntity.ok(resp);
    }

    Coupon c = opt.get();
    LocalDate today = LocalDate.now();

    boolean ok =
        Boolean.TRUE.equals(c.isActive()) &&
        (c.getStartDate() == null || !today.isBefore(c.getStartDate())) &&
        (c.getEndDate()   == null || !today.isAfter(c.getEndDate())) &&
        (c.getUsesLimit() == null || (c.getUsedCount() == null ? 0 : c.getUsedCount()) < c.getUsesLimit());

    resp.put("valid", ok);
    // Остальные поля кладём как Object, без Map.of, чтобы не словить проблем с типами
    resp.put("type",        c.getType() == null ? null : c.getType().name());
    resp.put("value",       c.getValue());
    resp.put("minSubtotal", c.getMinSubtotal());

    return ResponseEntity.ok(resp);
  }
}