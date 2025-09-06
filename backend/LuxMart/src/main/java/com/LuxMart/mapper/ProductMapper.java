package com.LuxMart.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import com.LuxMart.dto.requestDto.product.ProductRequestDto;
import com.LuxMart.dto.responseDto.product.ProductResponseDto;
import com.LuxMart.entity.ProductEntity;
import com.LuxMart.entity.ProductImageEntity;
import java.util.stream.Collectors;


@Mapper(componentModel = "spring", imports = {ProductImageEntity.class, Collectors.class})
public interface ProductMapper {

    @Mapping(target = "variants", ignore = true)
    @Mapping(target = "images", ignore = true)
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "store", ignore = true)
    @Mapping(target = "category", ignore = true)
    @Mapping(target = "status", ignore = true)
    @Mapping(target = "reviews", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    ProductEntity mapToProductEntity(ProductRequestDto dto);

    @Mapping(target = "imageUrls", expression = "java(product.getImages().stream().map(ProductImageEntity::getImageUrl).collect(Collectors.toList()))")
    @Mapping(target = "storeId", source = "store.id")
    @Mapping(target = "categoryId", source = "category.id")
    @Mapping(target = "updateAt", source = "updatedAt")
    ProductResponseDto mapToProductResponseDto(ProductEntity product);
}