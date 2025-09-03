package com.LuxMart.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import com.LuxMart.dto.requestDto.StoreRegisterRequest;
import com.LuxMart.dto.responseDto.StoreResponseDto;
import com.LuxMart.entity.StoreEntity;

@Mapper(componentModel = "spring")
public interface StoreMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "productEntities", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updateAt", ignore = true)
    @Mapping(target = "roles", ignore = true)
    @Mapping(target = "slug", expression = "java(storeRegisterRequest.getStoreName().trim().toLowerCase().replaceAll(\"[^a-z0-9]+\", \"-\"))")
    @Mapping(target = "logo", expression = "java(storeRegisterRequest.getLogo() != null ? storeRegisterRequest.getLogo().getOriginalFilename() : null)")
    StoreEntity mapToStoreEntity(StoreRegisterRequest storeRegisterRequest);

    @Mapping(target = "roles", source = "roles")
    @Mapping(target = "logo", source = "logo")
    @Mapping(target = "phone", source = "phone")
    @Mapping(target = "storeName", source = "storeName")
    @Mapping(target = "ownerName", source = "ownerName")
    @Mapping(target = "storeDescription", source = "storeDescription")
    @Mapping(target = "email", source = "email")
    @Mapping(target = "location", source = "location")
    @Mapping(target = "category", source = "category")
    @Mapping(target = "agreedToTerms", source = "agreedToTerms")
    @Mapping(target = "createdAt", source = "createdAt")
    @Mapping(target = "updateAt", source = "updateAt")
    StoreResponseDto mapToStoreResponse(StoreEntity storeEntity);
}