package com.LuxMart.dataLoader;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import com.LuxMart.entity.CategoryEntity;
import com.LuxMart.repository.CategoryRepository;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class CategoryDataLoader implements CommandLineRunner {

    private final CategoryRepository categoryRepository;

    @Override
    public void run(String... args) {
        if (categoryRepository.count() == 0) {

            CategoryEntity clothing = saveCategory("Clothing 👗", "clothing");
            CategoryEntity footwear = saveCategory("Footwear 👟", "footwear");
            CategoryEntity electronics = saveCategory("Electronics 📱", "electronics");
            CategoryEntity groceries = saveCategory("Groceries 🛒", "groceries");
            CategoryEntity books = saveCategory("Books 📚", "books");
            CategoryEntity toys = saveCategory("Toys 🧸", "toys");

            
            saveSubCategory(clothing, "Men’s Clothing", "mens-clothing");
            saveSubCategory(clothing, "Women’s Clothing", "womens-clothing");
            saveSubCategory(clothing, "Kids’ Clothing", "kids-clothing");
            saveSubCategory(clothing, "Outerwear", "outerwear");
            saveSubCategory(clothing, "Activewear", "activewear");

          
            saveSubCategory(footwear, "Men’s Footwear", "mens-footwear");
            saveSubCategory(footwear, "Women’s Footwear", "womens-footwear");
            saveSubCategory(footwear, "Sports Shoes", "sports-shoes");
            saveSubCategory(footwear, "Boots", "boots");
            saveSubCategory(footwear, "Sandals", "sandals");

          
            saveSubCategory(electronics, "Mobile Phones", "mobile-phones");
            saveSubCategory(electronics, "Computers", "computers");
            saveSubCategory(electronics, "Audio Equipment", "audio-equipment");
            saveSubCategory(electronics, "Cameras", "cameras");
            saveSubCategory(electronics, "Smartwatches", "smartwatches");

           
            saveSubCategory(groceries, "Fruits & Vegetables", "fruits-vegetables");
            saveSubCategory(groceries, "Dairy Products", "dairy-products");
            saveSubCategory(groceries, "Beverages", "beverages");
            saveSubCategory(groceries, "Bakery", "bakery");
            saveSubCategory(groceries, "Snacks", "snacks");

       
            saveSubCategory(books, "Fiction", "fiction");
            saveSubCategory(books, "Non-fiction", "non-fiction");
            saveSubCategory(books, "Comics", "comics");
            saveSubCategory(books, "Children’s Books", "childrens-books");
            saveSubCategory(books, "Textbooks", "textbooks");

       
            saveSubCategory(toys, "Educational Toys", "educational-toys");
            saveSubCategory(toys, "Action Figures", "action-figures");
            saveSubCategory(toys, "Puzzles", "puzzles");
            saveSubCategory(toys, "Dolls", "dolls");
            saveSubCategory(toys, "Remote Control Toys", "remote-control-toys");

            System.out.println("✅ Category seed data loaded successfully.");
        }
    }

    private CategoryEntity saveCategory(String name, String slug) {
        CategoryEntity category = new CategoryEntity();
        category.setNameEn(name);
        category.setSlug(slug);
        return categoryRepository.save(category);
    }

    private void saveSubCategory(CategoryEntity parent, String name, String slug) {
        CategoryEntity subcategory = new CategoryEntity();
        subcategory.setNameEn(name);
        subcategory.setSlug(slug);
        subcategory.setParent(parent);
        categoryRepository.save(subcategory);
    }
}
