package com.example.marketplace.controller;

import com.example.marketplace.model.*;
import com.example.marketplace.repository.*;
import com.example.marketplace.service.PricingService;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/products")
public class ProductController {
  private final ProductRepository products;
  private final ProductVariantRepository variants;
  private final CategoryRepository categories;
  private final PricingService pricing;

  public ProductController(ProductRepository products, ProductVariantRepository variants, CategoryRepository categories, PricingService pricing){
    this.products = products; this.variants = variants; this.categories = categories; this.pricing = pricing;
  }

  @GetMapping
  public List<Map<String,Object>> list(@RequestParam(required=false) Long categoryId){
    List<Product> list;
    if (categoryId != null) {
      Category cat = categories.findById(categoryId).orElse(null);
      list = (cat==null)? products.findAll() : products.findByCategory(cat);
    } else list = products.findAll();

    List<Map<String,Object>> out = new ArrayList<>();
    for (Product p : list){
      double cur = pricing.currentPriceUsd(p.getBasePriceUsd(), p.getSalePriceUsd());
      double old = pricing.oldPriceUsd(p.getBasePriceUsd(), p.getSalePriceUsd());
      Map<String,Object> m = new LinkedHashMap<>();
      m.put("id", p.getId());
      m.put("productId", p.getProductId());
      m.put("title", p.getTitle());
      m.put("categoryId", p.getCategory()!=null? p.getCategory().getId(): null);
      m.put("usdCurrent", cur);
      m.put("usdOld", old);
      out.add(m);
    }
    return out;
  }

  @PostMapping
  public Product create(@RequestBody Product p){
    // naive create; in real life validate, set productId, assign relations, etc.
    if (p.getProductId()==null) {
      p.setProductId("PRD-" + System.currentTimeMillis());
    }
    return products.save(p);
  }
}
