package com.LuxMart.service.impl;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.LuxMart.dto.requestDto.product.ProductRequestDto;
import com.LuxMart.dto.requestDto.product.ProductVariantRequestDto;
import com.LuxMart.dto.responseDto.product.ProductResponseDto;
import com.LuxMart.entity.CategoryEntity;
import com.LuxMart.entity.ProductEntity;
import com.LuxMart.entity.ProductVariantEntity;
import com.LuxMart.entity.StoreEntity;
import com.LuxMart.enums.Roles;
import com.LuxMart.exception.AccessDeniedException;
import com.LuxMart.mapper.ProductMapper;
import com.LuxMart.repository.CategoryRepository;
import com.LuxMart.repository.ProductRepository;
import com.LuxMart.security.util.StoreSecurityUtil;
import com.LuxMart.service.ProductService;
import com.LuxMart.utility.ProductUtility;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ProductServiceImpl implements ProductService{

      private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final StoreSecurityUtil storeSecurityUtil;
    private final ProductMapper productMapper;
    private final ProductUtility productUtility; 

    @Transactional
    @Override
    public ProductResponseDto addProduct(ProductRequestDto request) throws AccessDeniedException, java.nio.file.AccessDeniedException{
        StoreEntity store = storeSecurityUtil.getCurrentStore();

        if (!store.getRoles().equals(Roles.STORE_OWNER)) {
            throw new AccessDeniedException();
        }

        CategoryEntity category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new RuntimeException("Category not found"));

        ProductEntity product = ProductEntity.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .basePriceUSD(request.getBasePriceUSD())
                .salePriceUSD(request.getSalePriceUSD())
                .slug(request.getSlug() != null ? request.getSlug() : generateSlug(request.getTitle()))
                .store(store)
                .category(category)
                .build();

        List<ProductVariantEntity> variants = new ArrayList<>();
        if (request.getVariants() != null) {
            for (ProductVariantRequestDto variantDto : request.getVariants()) {
                ProductVariantEntity variant = ProductVariantEntity.builder()
                        .sku(generateSku(product.getTitle(), variantDto.getSize()))
                        .size(variantDto.getSize())
                        .stockQuantity(variantDto.getStockQuantity())
                        .variantPriceUSD(variantDto.getVariantPriceUSD())
                        .product(product)
                        .build();
                variants.add(variant);
            }
        }
        product.setVariants(variants);

        if (request.getImage() != null && !request.getImage().isEmpty()) {
            String imageUrl = productUtility.saveProductImage(request.getImage(), store.getId(), product.getId());
            product.setImageUrl(imageUrl);
        }

        ProductEntity savedProduct = productRepository.save(product);

        return productMapper.tProductResponseDto(savedProduct);
    }

    private String generateSlug(String title) {
        return title.toLowerCase().trim().replaceAll("\\s+", "-") + "-" + System.currentTimeMillis();
    }

    private String generateSku(String title, String size) {
        return title.substring(0, Math.min(3, title.length())).toUpperCase() +
               "-" + (size != null ? size.toUpperCase() : "ONE") +
               "-" + System.currentTimeMillis();
    }

}
