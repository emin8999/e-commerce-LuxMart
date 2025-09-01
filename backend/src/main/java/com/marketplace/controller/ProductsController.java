package com.marketplace.controller;

import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/products")
public class ProductsController {

  public record Variant(String id, String size, int stock, Double basePriceUSD, Double salePriceUSD) {}
  public record Product(String id, String storeId, String title, String categoryId, List<Variant> variants, Double basePriceUSD, Double salePriceUSD) {}

  private static final List<Product> DATA = List.of(
    new Product("p1","s1","T-Shirt Classic","mens-clothing",
      List.of(
        new Variant("p1-S","S",5, 10.0, 8.0),
        new Variant("p1-M","M",10, 10.0, 8.0),
        new Variant("p1-L","L",2, 10.0, 8.0),
        new Variant("p1-XL","XL",0, 10.0, 8.0)
      ),
    10.0, 8.0),
    new Product("p2","s2","Lipstick Premium","makeup",
      List.of(
        new Variant("p2-STD","STD",15, 25.0, null)
      ),
    25.0, null),
    new Product("p3","s1","Running Shoes","sports-shoes",
      List.of(new Variant("p3-42","42",8, 70.0, 59.0), new Variant("p3-43","43",5, 70.0, 59.0)),
    70.0, 59.0),
    new Product("p4","s3","Noise-Cancel Headphones","audio-equipment",
      List.of(new Variant("p4-STD","STD",12, 199.0, 179.0)),
    199.0, 179.0)
  );

  @GetMapping
  public List<Product> list(@RequestParam Optional<String> categoryId){
    if(categoryId.isPresent()){
      String c = categoryId.get();
      return DATA.stream().filter(p -> p.categoryId.equals(c)).toList();
    }
    return DATA;
  }

  @GetMapping("/{id}")
  public Product one(@PathVariable String id){
    return DATA.stream().filter(p -> p.id.equals(id)).findFirst().orElseThrow();
  }
}
