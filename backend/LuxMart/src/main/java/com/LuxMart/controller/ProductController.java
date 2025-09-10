package com.LuxMart.controller;

import java.nio.file.AccessDeniedException;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.PathVariable;
import com.LuxMart.dto.requestDto.product.ProductRequestDto;
import com.LuxMart.dto.requestDto.product.ProductUpdateRequestDto;
import com.LuxMart.dto.responseDto.product.ProductResponseDto;
import com.LuxMart.service.ProductService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    @PostMapping(consumes = "multipart/form-data")
    public ResponseEntity<ProductResponseDto> addProduct(
            @ModelAttribute @Valid ProductRequestDto productRequestDto)
           throws AccessDeniedException, java.nio.file.AccessDeniedException {

        ProductResponseDto savedProduct = productService.addProduct(productRequestDto);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedProduct);
    }
   
    @GetMapping("/my-store")
    public ResponseEntity<List<ProductResponseDto>> getProductsOfCurrentStore() throws AccessDeniedException, java.nio.file.AccessDeniedException {
        List<ProductResponseDto> products = productService.getAllProductsOfCurrentStore();
        return ResponseEntity.ok(products);
    }

    @GetMapping("/category/{categoryId}")
    public ResponseEntity<List<ProductResponseDto>> getProductsByCategory(
        @PathVariable("categoryId") Long categoryId) {  
    List<ProductResponseDto> products = productService.getProductsByCategory(categoryId);
    return ResponseEntity.ok(products);
}

     @GetMapping("/all-products")
    public ResponseEntity<List<ProductResponseDto>> getAllProducts() {
        List<ProductResponseDto> products = productService.getAllProducts();
        return ResponseEntity.ok(products);
    }

    @GetMapping("/public")
    public ResponseEntity<List<ProductResponseDto>> getAllActiveProducts() {
        List<ProductResponseDto> products = productService.getAllActiveProducts();
        return ResponseEntity.ok(products);
    }
    
     @GetMapping("/public/{id}")
    public ResponseEntity<ProductResponseDto> getProductById(@PathVariable("id") Long id) {
        ProductResponseDto product = productService.getActiveProductById(id);
        return ResponseEntity.ok(product);
    }

     @PutMapping("/update/{id}")
    public ResponseEntity<String> updateProduct(
            @PathVariable("id") Long id,
            @ModelAttribute ProductUpdateRequestDto dto) throws AccessDeniedException {

        productService.updateProduct(id, dto);
        return ResponseEntity.ok("Product updated successfully");
    }
}
