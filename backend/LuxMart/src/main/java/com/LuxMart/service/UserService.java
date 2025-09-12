package com.LuxMart.service;

import java.util.List;

import com.LuxMart.dto.requestDto.LoginRequestDto;
import com.LuxMart.dto.requestDto.RegisterRequestDto;
import com.LuxMart.dto.requestDto.UserUpdateRequestDto;
import com.LuxMart.dto.responseDto.LoginResponseDto;
import com.LuxMart.dto.responseDto.RegisterResponseDto;
import com.LuxMart.dto.responseDto.UserResponseDto;

public interface UserService {

    RegisterResponseDto register(RegisterRequestDto registerRequestDto);

    LoginResponseDto login(LoginRequestDto loginRequestDto);

     LoginResponseDto adminLogin(LoginRequestDto loginRequestDto);

      void logout(String token);

       UserResponseDto getCurrentUser();

       void updateUser(Long userId, UserUpdateRequestDto dto);

       List<UserResponseDto> getAllUsersForAdmin();

       UserResponseDto getUserByIdForAdmin(Long id) ;
}

