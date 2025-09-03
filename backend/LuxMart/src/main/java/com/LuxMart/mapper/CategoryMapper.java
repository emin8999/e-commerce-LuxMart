package com.LuxMart.mapper;

import java.util.List;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import com.LuxMart.dto.requestDto.category.CategoryRequestDto;
import com.LuxMart.dto.responseDto.category.CategoryResponseDto;
import com.LuxMart.entity.CategoryEntity;

@Mapper(componentModel = "spring")
public interface CategoryMapper {

    @Mapping(target = "parentId", source = "parent.id")
    CategoryResponseDto toCategoryResponseDto(CategoryEntity category);

    List<CategoryResponseDto> toCategoryResponseList(List<CategoryEntity> categories);


    @Mapping(target = "id", ignore = true)
    @Mapping(target = "parent", ignore = true)
    @Mapping(target = "products", ignore = true)
    @Mapping(target = "subcategories", ignore = true)
    CategoryEntity toCategoryEntity(CategoryRequestDto requestDto);

   // List<CategoryResponseDto>toCategoryResponseList(List<CategoryEntity>entities);
}
