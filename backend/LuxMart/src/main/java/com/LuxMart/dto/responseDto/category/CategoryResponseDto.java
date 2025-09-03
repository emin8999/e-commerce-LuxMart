package com.LuxMart.dto.responseDto.category;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CategoryResponseDto {

    private Long id; 
    private String nameEn;
    private String nameAz;
    private String nameEs;
    private String nameDe;
    private String slug;
    private String emoji;
    private Long parentId;
    private List<CategoryResponseDto>subcategories;
    
}
