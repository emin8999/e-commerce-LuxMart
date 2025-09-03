package com.LuxMart.service;

import java.util.List;

import com.LuxMart.dto.requestDto.category.CategoryRequestDto;
import com.LuxMart.dto.responseDto.category.CategoryResponseDto;

public interface CategoryService {

    CategoryResponseDto createCategory(CategoryRequestDto dto);

    CategoryResponseDto updateCategory(Long id, CategoryRequestDto dto);

    void deleteCategory(Long id);

    List<CategoryResponseDto> getAllCategories();

    CategoryResponseDto getCategoryById(Long id);
    
}
