package com.LuxMart.controller;

import java.nio.file.AccessDeniedException;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.LuxMart.dto.requestDto.product.ProductRequestDto;
import com.LuxMart.dto.responseDto.product.ProductResponseDto;
import com.LuxMart.service.ProductService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    //@PostMapping(consumes = "multipart/form-data")
    //public ResponseEntity<ProductResponseDto> addProduct(
    //        @ModelAttribute @Valid ProductRequestDto productRequestDto
   // ) throws AccessDeniedException, java.nio.file.AccessDeniedException {
    //    ProductResponseDto savedProduct = productService.addProduct(productRequestDto);
   //     return ResponseEntity.status(HttpStatus.CREATED).body(savedProduct);
    //}

@PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
public ResponseEntity<ProductResponseDto> addProduct(
        @RequestPart("product") @Valid ProductRequestDto productRequestDto,
        @RequestPart("image") MultipartFile image
) throws AccessDeniedException {
    productRequestDto.setImage(image);
    ProductResponseDto savedProduct = productService.addProduct(productRequestDto);
    return ResponseEntity.status(HttpStatus.CREATED).body(savedProduct);
}



}
