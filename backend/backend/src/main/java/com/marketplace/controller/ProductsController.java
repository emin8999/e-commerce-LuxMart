package com.marketplace.controller;
import com.marketplace.model.*; import com.marketplace.repo.*; import com.marketplace.util.Slugify;
import jakarta.validation.Valid; import jakarta.validation.constraints.*; import lombok.Data;
import org.springframework.http.ResponseEntity; import org.springframework.web.bind.annotation.*; import java.util.*;
@RestController @RequestMapping("/api/products")
public class ProductsController {
  private final ProductRepository products; private final ProductVariantRepository variants; private final CategoryRepository categories; private final StoreRepository stores;
  public ProductsController(ProductRepository products, ProductVariantRepository variants, CategoryRepository categories, StoreRepository stores){
    this.products=products; this.variants=variants; this.categories=categories; this.stores=stores; }
  @GetMapping public List<Product> list(@RequestParam Optional<String> categorySlug){
    if(categorySlug.isPresent()){ Category c=categories.findBySlug(categorySlug.get()); if(c==null) return List.of();
      return products.findAll().stream().filter(p-> p.getCategory()!=null && p.getCategory().getId().equals(c.getId())).toList(); }
    return products.findAll(); }
  @GetMapping("/{id}") public Product one(@PathVariable Long id){ return products.findById(id).orElseThrow(); }
  @GetMapping("/slug/{slug}") public Product bySlug(@PathVariable String slug){ return products.findBySlug(slug); }
  @Data public static class VariantIn { public String size; @Min(0) public Integer stock; @Min(0) public Double basePriceUSD; @Min(0) public Double salePriceUSD; public String sku; }
  @Data public static class ProductIn { @NotNull public Long storeId; @NotBlank public String title; public String description; @NotBlank public String categorySlug; @Min(0) public Double basePriceUSD; @Min(0) public Double salePriceUSD; public java.util.List<@Valid VariantIn> variants; }
  @PostMapping public Product create(@RequestBody @Valid ProductIn in){
    Store s = stores.findById(in.getStoreId()).orElseThrow(); Category c = categories.findBySlug(in.getCategorySlug());
    Product p = Product.builder().store(s).category(c).title(in.getTitle()).slug(Slugify.slug(in.getTitle())).description(in.getDescription()).basePriceUSD(in.getBasePriceUSD()).salePriceUSD(in.getSalePriceUSD()).build();
    Product saved = products.save(p);
    if(in.getVariants()!=null){ for(VariantIn vin: in.getVariants()){
      ProductVariant v = ProductVariant.builder().product(saved).size(vin.getSize()).stock(vin.getStock()).basePriceUSD(vin.getBasePriceUSD()!=null?vin.getBasePriceUSD():saved.getBasePriceUSD()).salePriceUSD(vin.getSalePriceUSD()!=null?vin.getSalePriceUSD():saved.getSalePriceUSD()).sku(vin.getSku()!=null?vin.getSku(): saved.getSlug()+"-"+(vin.getSize()==null?"STD":vin.getSize())).build();
      variants.save(v);} }
    return saved; }
  @DeleteMapping("/{id}") public ResponseEntity<?> delete(@PathVariable Long id){ products.deleteById(id); return ResponseEntity.noContent().build(); }
}