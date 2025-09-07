package com.LuxMart.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import com.LuxMart.dto.requestDto.RegisterRequestDto;
import com.LuxMart.dto.responseDto.RegisterResponseDto;
import com.LuxMart.dto.responseDto.UserResponseDto;
import com.LuxMart.entity.UserEntity;

@Mapper(componentModel = "spring")
public interface UserMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "roles", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(source = "name", target = "name")
    @Mapping(source = "email", target = "email")
    @Mapping(source = "password", target = "password")
    UserEntity mapToUser(RegisterRequestDto registerRequestDto);

    @Mapping(target = "message", ignore = true)
  //  @Mapping(source  = "address",target= "addresses")
    RegisterResponseDto mapToRegisterResponseDto(UserEntity user);

    //@Mapping(source  = "addresses",target= "addresses")
    UserResponseDto mapToUserResponseDto(UserEntity userEntity);
}
