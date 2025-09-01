package com.example.marketplace.controller;

import com.example.marketplace.model.Category;
import com.example.marketplace.repository.CategoryRepository;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/categories")
public class CategoryController {
  private final CategoryRepository repo;
  public CategoryController(CategoryRepository repo){ this.repo = repo; }

  @GetMapping
  public List<Category> all() { return repo.findAll(); }
}
