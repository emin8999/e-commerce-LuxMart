package com.marketplace.controller;

import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/stores")
public class StoresController {
  public record Store(String id, String name, String logo){}

  @GetMapping
  public List<Store> list(){
    return List.of(
      new Store("s1","Lux Apparel","🧥"),
      new Store("s2","Beauty Lab","💄"),
      new Store("s3","AudioPro","🎧")
    );
  }
}
