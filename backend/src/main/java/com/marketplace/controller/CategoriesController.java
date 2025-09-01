package com.marketplace.controller;

import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/categories")
public class CategoriesController {

  public record Category(String id, String name, String parentId) {}

  @GetMapping
  public List<Category> list(){
    List<Category> list = new ArrayList<>();
    // Top-level categories
    list.add(new Category("clothing", "Clothing", null));
    list.add(new Category("footwear", "Footwear", null));
    list.add(new Category("electronics", "Electronics", null));
    list.add(new Category("groceries", "Groceries", null));
    list.add(new Category("books", "Books", null));
    list.add(new Category("toys", "Toys", null));
    list.add(new Category("jewelry", "Jewelry", null));
    list.add(new Category("tech", "Tech", null));
    list.add(new Category("cosmetics", "Cosmetics", null));
    list.add(new Category("furniture", "Furniture", null));
    list.add(new Category("auto-products", "Auto Products", null));
    list.add(new Category("home-garden", "Home & Garden", null));
    list.add(new Category("sports", "Sports", null));
    list.add(new Category("health", "Health", null));
    list.add(new Category("music", "Music", null));
    list.add(new Category("movies", "Movies", null));
    list.add(new Category("photography", "Photography", null));
    list.add(new Category("gifts", "Gifts", null));
    list.add(new Category("pets", "Pets", null));
    list.add(new Category("baby", "Baby", null));
    list.add(new Category("tourism", "Tourism", null));
    list.add(new Category("stationery", "Stationery", null));
    list.add(new Category("tools", "Tools", null));
    list.add(new Category("games", "Games", null));
    list.add(new Category("accessories", "Accessories", null));

    // few children as demo (can expand similarly)
    list.add(new Category("mens-clothing", "Men’s Clothing", "clothing"));
    list.add(new Category("womens-clothing", "Women’s Clothing", "clothing"));
    list.add(new Category("kids-clothing", "Kids’ Clothing", "clothing"));
    list.add(new Category("outerwear", "Outerwear", "clothing"));
    list.add(new Category("activewear", "Activewear", "clothing"));
    list.add(new Category("mobile-phones", "Mobile Phones", "electronics"));
    list.add(new Category("computers", "Computers", "electronics"));
    list.add(new Category("makeup", "Makeup", "cosmetics"));
    list.add(new Category("skincare", "Skincare", "cosmetics"));
    list.add(new Category("perfumes", "Perfumes", "cosmetics"));
    return list;
  }
}
