package com.LuxMart.service;

import com.LuxMart.dto.requestDto.LoginRequestDto;
import com.LuxMart.dto.requestDto.StoreRegisterRequest;
import com.LuxMart.dto.requestDto.StoreUpdateRequestDto;
import com.LuxMart.dto.responseDto.LoginResponseDto;
import com.LuxMart.dto.responseDto.StoreResponseDto;
import java.nio.file.AccessDeniedException;
import java.util.List;

public interface StoreService {

  void registerStore(StoreRegisterRequest request);

  LoginResponseDto login(LoginRequestDto loginRequestDto);

  void logout(String token);

  StoreResponseDto getCurrentStoreInfo() throws AccessDeniedException;

   List<StoreResponseDto> getAllStores();

    void deleteStore(Long id);

  public void updateStore(Long storeId, StoreUpdateRequestDto dto) throws AccessDeniedException;
}
