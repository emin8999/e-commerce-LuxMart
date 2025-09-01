package com.marketplace.controller;

import org.springframework.web.bind.annotation.*;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/api/orders")
public class OrdersController {

  public record Order(String id, String status){}
  private final Map<String, String> statuses = new ConcurrentHashMap<>(Map.of("o1","processing","o2","shipped","o3","delivered"));

  @GetMapping
  public List<Order> list(){
    return statuses.entrySet().stream().map(e -> new Order(e.getKey(), e.getValue())).toList();
  }

  @PostMapping("/{id}/status")
  public Order setStatus(@PathVariable String id, @RequestBody Map<String,String> body){
    String s = body.getOrDefault("status","processing");
    statuses.put(id, s);
    return new Order(id, s);
  }
}
