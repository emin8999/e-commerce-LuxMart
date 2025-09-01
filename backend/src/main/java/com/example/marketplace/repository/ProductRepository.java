package com.example.marketplace.repository;
import com.example.marketplace.model.Product;
import com.example.marketplace.model.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface ProductRepository extends JpaRepository<Product, Long> {
  List<Product> findByCategory(Category category);
}