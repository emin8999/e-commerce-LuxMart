package com.LuxMart.service.impl;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

import org.springframework.stereotype.Service;

import com.LuxMart.dto.requestDto.product.ProductRequestDto;
import com.LuxMart.dto.responseDto.product.ProductResponseDto;
import com.LuxMart.entity.CategoryEntity;
import com.LuxMart.entity.ProductEntity;
import com.LuxMart.entity.ProductImageEntity;
import com.LuxMart.entity.ProductVariantEntity;
import com.LuxMart.entity.StoreEntity;
import com.LuxMart.exception.AccessDeniedException;
import com.LuxMart.mapper.ProductMapper;
import com.LuxMart.repository.CategoryRepository;
import com.LuxMart.repository.ProductRepository;
import com.LuxMart.repository.ProductVariantRepository;
import com.LuxMart.security.util.StoreSecurityUtil;
import com.LuxMart.service.ProductService;
import com.LuxMart.utility.ProductUtility;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ProductServiceImpl implements ProductService {

       private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final StoreSecurityUtil storeSecurityUtil;
    private final ProductMapper productMapper;
    private final ProductUtility productUtility;
    private final ProductVariantRepository productVariantRepository;

   @Override
    @Transactional
    public ProductResponseDto addProduct(ProductRequestDto productRequestDto)
            throws AccessDeniedException, java.nio.file.AccessDeniedException {

        StoreEntity store = storeSecurityUtil.getCurrentStore();
        if (store.getRoles() == null || store.getRoles().stream()
                .noneMatch(role -> role.name().equals("STORE_OWNER"))) {
            throw new AccessDeniedException();
        }

        CategoryEntity category = categoryRepository.findById(productRequestDto.getCategoryId())
                .orElseThrow(() -> new RuntimeException("Category not found"));

        ProductEntity product = productMapper.mapToProductEntity(productRequestDto);
        product.setStore(store);
        product.setCategory(category);

        
        String slug = productRequestDto.getSlug();
        if (slug == null || slug.isBlank()) {
            slug = generateSlug(productRequestDto.getTitle());
        }
        slug = ensureUniqueSlug(slug);
        product.setSlug(slug);

        ProductEntity savedProduct = productRepository.save(product);

        if (productRequestDto.getVariants() != null && !productRequestDto.getVariants().isEmpty()) {
            List<ProductVariantEntity> variants = productRequestDto.getVariants().stream()
                    .map(variantDto -> {
                        String sku = generateSku(savedProduct.getTitle(), variantDto.getSize());
                        sku = ensureUniqueSku(sku);

                        return ProductVariantEntity.builder()
                                .sku(sku)
                                .size(variantDto.getSize())
                                .stockQuantity(variantDto.getStockQuantity())
                                .variantPriceUSD(variantDto.getVariantPriceUSD())
                                .product(savedProduct)
                                .build();
                    }).collect(Collectors.toList());

            
            if (savedProduct.getVariants() == null) {
                savedProduct.setVariants(new ArrayList<>());
            }
            savedProduct.getVariants().clear();
            savedProduct.getVariants().addAll(variants);
        }

        if (productRequestDto.getImageUrls() != null && !productRequestDto.getImageUrls().isEmpty()) {
            List<String> imagePaths = productUtility.saveProductImages(
                    productRequestDto.getImageUrls(), store.getId(), savedProduct.getId()
            );

            List<ProductImageEntity> imageEntities = IntStream.range(0, imagePaths.size())
                    .mapToObj(i -> {
                        ProductImageEntity imageEntity = new ProductImageEntity();
                        imageEntity.setImageUrl(imagePaths.get(i));
                        imageEntity.setProduct(savedProduct);
                        return imageEntity;
                    }).collect(Collectors.toList());

            savedProduct.setImages(imageEntities);
        }

        ProductEntity finalProduct = productRepository.save(savedProduct);

        return productMapper.mapToProductResponseDto(finalProduct);
    }

    private String generateSlug(String title) {
        return title.toLowerCase()
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("-+$", "");
    }

    private String generateSku(String title, String size) {
        return (title + "-" + size + "-" + UUID.randomUUID().toString().substring(0, 8)).toUpperCase();
    }

  
    private String ensureUniqueSlug(String baseSlug) {
        String slug = baseSlug;
        int counter = 1;
        while (productRepository.existsBySlug(slug)) {
            slug = baseSlug + "-" + counter;
            counter++;
        }
        return slug;
    }

   
    private String ensureUniqueSku(String baseSku) {
        String sku = baseSku;
        while (productVariantRepository.existsBySku(sku)) {
            sku = baseSku + "-" + UUID.randomUUID().toString().substring(0, 4);
        }
        return sku;
    }
}