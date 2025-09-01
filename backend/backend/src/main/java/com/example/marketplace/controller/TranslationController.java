package com.example.marketplace.controller;

import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/i18n")
public class TranslationController {
  // Stub: In production, read from DB. For now serve a few demo keys.
  @GetMapping
  public Map<String, String> all(@RequestParam(defaultValue="en") String locale){
    Map<String,String> m = new LinkedHashMap<>();
    m.put("nav.home","Home");
    m.put("nav.products","Products");
    m.put("nav.our_stores","Our Stores");
    m.put("nav.customer_service","Customer Service");
    m.put("nav.category","Category");
    return m;
  }
}
