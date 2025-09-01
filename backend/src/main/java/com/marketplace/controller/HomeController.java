package com.marketplace.controller;

import org.springframework.web.bind.annotation.*;
import java.util.*;
import static java.util.stream.Collectors.toList;

@RestController
@RequestMapping("/api/home")
public class HomeController {

  public record Variant(String id, String size, int stock, Double basePriceUSD, Double salePriceUSD) {}
  public record Product(String id, String storeId, String title, String categoryId, List<Variant> variants, Double basePriceUSD, Double salePriceUSD) {}
  private static final List<Product> PRODUCTS = com.marketplace.controller.ProductsController.DATA;

  @GetMapping
  public Map<String, Object> home(){
    Map<String,Object> res = new LinkedHashMap<>();
    List<Product> sale = PRODUCTS.stream().filter(p -> p.salePriceUSD!=null && p.salePriceUSD < p.basePriceUSD).toList();
    List<Product> best = PRODUCTS.subList(0, Math.min(3, PRODUCTS.size()));
    List<Product> fbt = PRODUCTS.subList(0, Math.min(3, PRODUCTS.size()));
    res.put("sale", sale);
    res.put("best", best);
    res.put("frequentlyTogether", fbt);
    return res;
  }
}
