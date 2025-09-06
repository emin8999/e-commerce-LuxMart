package com.LuxMart.dto.requestDto.product;

import java.math.BigDecimal;
import java.util.List;

import org.springframework.web.multipart.MultipartFile;

import jakarta.validation.constraints.NotNull;
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
public class ProductRequestDto {

    private String title;
    private String slug;
    private String description;
    private BigDecimal basePriceUSD;
    private BigDecimal salePriceUSD;
    private Long categoryId;
    @NotNull(message = "Please upload photo")
    private List< MultipartFile> imageUrls;
    private List<ProductVariantRequestDto>variants;

}
