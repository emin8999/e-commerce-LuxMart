package com.LuxMart.service.impl;

import java.util.List;
import org.springframework.stereotype.Service;
import com.LuxMart.dto.requestDto.category.CategoryRequestDto;
import com.LuxMart.dto.responseDto.category.CategoryResponseDto;
import com.LuxMart.entity.CategoryEntity;
import com.LuxMart.mapper.CategoryMapper;
import com.LuxMart.repository.CategoryRepository;
import com.LuxMart.service.CategoryService;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class CategoryServiceImpl implements CategoryService {

    private final CategoryRepository categoryRepository;
    private final CategoryMapper categoryMapper;

    @Override
    public CategoryResponseDto createCategory(CategoryRequestDto dto) {
        CategoryEntity category = categoryMapper.toCategoryEntity(dto);

        if (dto.getParentId() != null) {
            CategoryEntity parent = categoryRepository.findById(dto.getParentId())
                    .orElseThrow(() -> new RuntimeException("Parent category not found"));
            category.setParent(parent);
        }

        CategoryEntity saved = categoryRepository.save(category);
        return categoryMapper.toCategoryResponseDto(saved); 
    }

    @Override
    public CategoryResponseDto updateCategory(Long id, CategoryRequestDto dto) {
        CategoryEntity category = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Category not found"));

        category.setNameEn(dto.getNameEn());
        category.setNameAz(dto.getNameAz());
        category.setNameEs(dto.getNameEs());
        category.setNameDe(dto.getNameDe());
        category.setEmoji(dto.getEmoji());
        category.setSlug(dto.getSlug()); 

        if (dto.getParentId() != null) {
            CategoryEntity parent = categoryRepository.findById(dto.getParentId())
                    .orElseThrow(() -> new RuntimeException("Parent category not found"));
            category.setParent(parent);
        } else {
            category.setParent(null);
        }

        CategoryEntity updated = categoryRepository.save(category);
        return categoryMapper.toCategoryResponseDto(updated);
    }

    @Override
    public void deleteCategory(Long id) {
        CategoryEntity category = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Category not found"));
        categoryRepository.delete(category);
    }

    @Override
    @Transactional
    public List<CategoryResponseDto> getAllCategories() {
        return categoryMapper.toCategoryResponseList(categoryRepository.findAll()); 
    }

    @Override
    public CategoryResponseDto getCategoryById(Long id) {
        CategoryEntity category = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Category not found"));
        return categoryMapper.toCategoryResponseDto(category);
    }
}