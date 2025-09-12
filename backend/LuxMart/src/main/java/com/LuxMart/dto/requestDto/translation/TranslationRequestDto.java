package com.LuxMart.dto.requestDto.translation;

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
public class TranslationRequestDto {

    private String translationKey; // ex: "common.cart.empty"
    private String language;       // EN, AZ, RU
    private String value;          // mətni


}