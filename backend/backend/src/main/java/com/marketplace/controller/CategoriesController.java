package com.marketplace.controller;
import com.marketplace.model.Category; import com.marketplace.repo.CategoryRepository;
import org.springframework.web.bind.annotation.*; import java.util.*;
@RestController @RequestMapping("/api/categories")
public class CategoriesController {
  private final CategoryRepository categories;
  public CategoriesController(CategoryRepository categories){ this.categories=categories; }
  @GetMapping public List<Category> list(){ return categories.findAll(); }
}