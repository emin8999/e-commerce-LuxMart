package com.LuxMart.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.factory.Mappers;

import com.LuxMart.dto.responseDto.product.ProductResponseDto;
import com.LuxMart.entity.ProductEntity;

@Mapper(componentModel = "spring")
public interface ProductMapper {

    ProductMapper INSTANCE =Mappers.getMapper(ProductMapper.class);

    ProductResponseDto tProductResponseDto(ProductEntity productEntity);
}
