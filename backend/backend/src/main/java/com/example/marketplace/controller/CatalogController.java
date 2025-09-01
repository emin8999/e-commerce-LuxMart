package com.example.marketplace.controller;
import org.springframework.web.bind.annotation.*;
import java.util.*;
@RestController @RequestMapping("/api")
public class CatalogController {
  @GetMapping("/categories")
  public Map<String,List<String>> categories(){
    // Demo response; real impl should query DB
    return Map.of("Clothing", List.of("Men's Clothing","Women's Clothing"));
  }
  @GetMapping("/products")
  public List<Map<String,Object>> products(){
    return List.of(
      Map.of("id",1,"title","T-shirt","store","Alpha","baseUSD",20,"saleUSD",15,"discountPercent",0),
      Map.of("id",2,"title","Sneakers","store","Beta","baseUSD",120,"saleUSD",null,"discountPercent",10)
    );
  }
}
