package com.LuxMart.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;


import java.util.List;
import java.util.Set;

import com.LuxMart.cloudinary.CloudinaryService;
import com.LuxMart.dto.requestDto.LoginRequestDto;
import com.LuxMart.dto.requestDto.StoreRegisterRequest;
import com.LuxMart.dto.responseDto.LoginResponseDto;
import com.LuxMart.dto.responseDto.StoreResponseDto;
import com.LuxMart.entity.StoreEntity;
import com.LuxMart.enums.Roles;
import com.LuxMart.exception.EmailAlreadyExistsException;
import com.LuxMart.exception.PasswordMismatchException;
import com.LuxMart.mapper.StoreMapper;
import com.LuxMart.repository.StoreRepository;
import com.LuxMart.security.jwt.JwtService;
import com.LuxMart.security.store.StorePrincipal;
import com.LuxMart.security.util.StoreSecurityUtil;
import com.LuxMart.service.StoreService;
import com.LuxMart.service.TokenBlacklistService;
import java.nio.file.AccessDeniedException;

@Service
@RequiredArgsConstructor
public class StoreServiceImpl implements StoreService {

    private final StoreRepository storeRepository;
    private final StoreMapper storeMapper;
    private final JwtService jwtService;
    private final BCryptPasswordEncoder bCryptPasswordEncoder;
    private final AuthenticationManager authenticationManager;
    private final StoreSecurityUtil storeSecurityUtil;
    private final CloudinaryService cloudinaryService;
    private final TokenBlacklistService tokenBlacklistService;

@Override
    public void registerStore(StoreRegisterRequest request) {

        if (storeRepository.existsByEmail(request.getEmail())) {
            throw new EmailAlreadyExistsException("Email already exists");
        }

        if (!request.getPassword().equals(request.getConfirmPassword())) {
            throw new PasswordMismatchException();
        }

        if (!Boolean.TRUE.equals(request.getAgreedToTerms())) {
            throw new IllegalArgumentException("You must agree to terms");
        }

        StoreEntity store = storeMapper.mapToStoreEntity(request);
        store.setPassword(bCryptPasswordEncoder.encode(request.getPassword()));
        store.setRoles(Set.of(Roles.STORE_OWNER));

        store = storeRepository.save(store);

        String storeFolder = "image/store_" + store.getId();

        if (request.getLogo() != null && !request.getLogo().isEmpty()) {
            String logoUrl = cloudinaryService.uploadFile(request.getLogo(), storeFolder + "/logo", "logo");
            store.setLogo(logoUrl);
        }

        storeRepository.save(store);
    }
    

     @Override
    public LoginResponseDto login(LoginRequestDto loginRequestDto) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(loginRequestDto.getEmail(), loginRequestDto.getPassword()));

            StoreEntity store = storeRepository.findStoreEntitiesByEmail(loginRequestDto.getEmail())
                    .orElseThrow(() -> new RuntimeException("Store not found"));

            StorePrincipal storePrincipal = new StorePrincipal(store);
            String token = jwtService.generateToken(storePrincipal);

            return new LoginResponseDto(token, "Bearer");

        } catch (Exception e) {
            throw new RuntimeException("Authentication failed: " + e.getMessage());
        }
    }
        
    @Override
    public void logout(String token) {
        tokenBlacklistService.blacklistToken(token);
        SecurityContextHolder.clearContext();
    }

      @Override
    public StoreResponseDto getCurrentStoreInfo() throws AccessDeniedException {
        StoreEntity store = storeSecurityUtil.getCurrentStore();
        return storeMapper.mapToStoreResponse(store);
    }

    @Override
    public void deleteStore(Long id) {
        storeRepository.deleteById(id);
    }


    public List<StoreResponseDto>getAllStores(){
        return storeRepository.findAll()
        .stream()
        .map(storeMapper::mapToStoreResponse)
        .toList();
    }
   

}
