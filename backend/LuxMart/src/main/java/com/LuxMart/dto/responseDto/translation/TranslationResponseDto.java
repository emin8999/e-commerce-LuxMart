package com.LuxMart.dto.responseDto.translation;

import java.time.LocalDateTime;

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
public class TranslationResponseDto {

    private Long id;
    private String translationKey;
    private String language;
    private String value;
    private LocalDateTime updatedAt;
    
}
