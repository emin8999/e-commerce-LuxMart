package com.marketplace.controller;
import com.marketplace.model.Store; import com.marketplace.repo.StoreRepository;
import org.springframework.web.bind.annotation.*; import java.util.*;
@RestController @RequestMapping("/api/stores")
public class StoresController {
  private final StoreRepository stores;
  public StoresController(StoreRepository stores){ this.stores=stores; }
  @GetMapping public List<Store> list(){ return stores.findAll(); }
}