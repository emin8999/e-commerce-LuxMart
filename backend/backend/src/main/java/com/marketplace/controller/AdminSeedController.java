package com.marketplace.controller;
import com.marketplace.model.*; import com.marketplace.repo.*; import com.marketplace.util.Slugify;
import org.springframework.web.bind.annotation.*; import java.util.*;
@RestController @RequestMapping("/api/admin/seed")
public class AdminSeedController {
  private final StoreRepository stores; private final CategoryRepository categories; private final ProductRepository products; private final ProductVariantRepository variants;
  public AdminSeedController(StoreRepository stores, CategoryRepository categories, ProductRepository products, ProductVariantRepository variants){
    this.stores=stores; this.categories=categories; this.products=products; this.variants=variants; }
  @PostMapping public Map<String,Object> seed(){
    if(stores.count()==0){ stores.save(Store.builder().name("Lux Apparel").slug("lux-apparel").build()); stores.save(Store.builder().name("Beauty Lab").slug("beauty-lab").build()); }
    if(categories.count()==0){ categories.save(Category.builder().name("Men’s Clothing").slug("mens-clothing").build()); categories.save(Category.builder().name("Makeup").slug("makeup").build()); }
    if(products.count()==0){
      Store s1 = stores.findBySlug("lux-apparel"); Category c1 = categories.findBySlug("mens-clothing");
      Product p1 = Product.builder().store(s1).category(c1).title("T-Shirt Classic").slug(Slugify.slug("T-Shirt Classic")).basePriceUSD(10.0).salePriceUSD(8.0).build(); products.save(p1);
      variants.save(ProductVariant.builder().product(p1).size("S").stock(5).basePriceUSD(10.0).salePriceUSD(8.0).sku(p1.getSlug()+"-S").build());
      variants.save(ProductVariant.builder().product(p1).size("M").stock(10).basePriceUSD(10.0).salePriceUSD(8.0).sku(p1.getSlug()+"-M").build());
    }
    return Map.of("ok", true);
  }
}