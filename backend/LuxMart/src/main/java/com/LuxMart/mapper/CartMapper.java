package com.LuxMart.mapper;

import java.util.List;

import org.mapstruct.Context;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import com.LuxMart.dto.responseDto.cart.CartItemDto;
import com.LuxMart.dto.responseDto.cart.CartResponse;
import com.LuxMart.entity.CartEntity;
import com.LuxMart.entity.CartItemEntity;

@Mapper(componentModel = "spring")
public interface CartMapper {
    @Mapping(source = "cart.id", target = "cartId")
    @Mapping(source = "cart.user.id", target = "userId")
    @Mapping(source = "cart.updatedAt", target = "updatedAt")
    @Mapping(target = "totalPrice", ignore = true)       // service-də hesablanacaq
    @Mapping(target = "totalItemsCount", ignore = true) // service-də hesablanacaq
    CartResponse toCartResponse(CartEntity cart, @Context List<CartItemDto> items);
    @Mapping(source = "id", target = "id")
    @Mapping(source = "product.id", target = "productId")
    @Mapping(source = "product.title", target = "productTitle")
    @Mapping(source = "product.slug", target = "productSlug")
    @Mapping(source = "size", target = "size")
    @Mapping(source = "quantity", target = "quantity")
    @Mapping(source = "unitPrice", target = "unitPrice")
    @Mapping(target = "totalPrice", ignore = true) // service-də hesablanacaq
    CartItemDto toCartItemDto(CartItemEntity item);
}