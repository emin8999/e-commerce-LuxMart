package com.example.marketplace.repository;
import com.example.marketplace.model.Review;
import org.springframework.data.jpa.repository.JpaRepository;
public interface ReviewRepository extends JpaRepository<Review, Long> {}