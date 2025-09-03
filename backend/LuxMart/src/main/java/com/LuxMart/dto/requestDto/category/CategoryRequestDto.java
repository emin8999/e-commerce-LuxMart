package com.LuxMart.dto.requestDto.category;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class CategoryRequestDto {
    
    private String nameEn;
    private String nameAz;
    private String nameEs;
    private String nameDe;
    private String emoji;
    private String slug;
    private Long parentId;
    
}
