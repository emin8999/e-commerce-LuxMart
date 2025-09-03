package com.LuxMart.service;

import com.LuxMart.dto.requestDto.product.ProductRequestDto;
import com.LuxMart.dto.responseDto.product.ProductResponseDto;
import com.LuxMart.exception.AccessDeniedException;

public interface ProductService {

    ProductResponseDto addProduct(ProductRequestDto request)
            throws AccessDeniedException, java.nio.file.AccessDeniedException;

}
