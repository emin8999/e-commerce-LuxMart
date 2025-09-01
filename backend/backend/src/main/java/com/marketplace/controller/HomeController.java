package com.marketplace.controller;
import com.marketplace.model.Product; import com.marketplace.repo.ProductRepository;
import org.springframework.web.bind.annotation.*; import java.util.*;
@RestController @RequestMapping("/api/home")
public class HomeController {
  private final ProductRepository products;
  public HomeController(ProductRepository products){ this.products=products; }
  @GetMapping public Map<String,Object> home(){
    var all = products.findAll();
    var sale = all.stream().filter(p-> p.getSalePriceUSD()!=null && p.getSalePriceUSD() < p.getBasePriceUSD()).limit(10).toList();
    var best = all.stream().limit(10).toList();
    var fbt = all.stream().limit(10).toList();
    return Map.of("sale", sale, "best", best, "frequentlyTogether", fbt);
  }
}