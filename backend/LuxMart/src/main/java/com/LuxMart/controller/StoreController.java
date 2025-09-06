package com.LuxMart.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import jakarta.servlet.http.HttpServletRequest;
import com.LuxMart.dto.requestDto.LoginRequestDto;
import com.LuxMart.dto.requestDto.StoreRegisterRequest;
import com.LuxMart.dto.responseDto.LoginResponseDto;
import com.LuxMart.dto.responseDto.StoreResponseDto;
import com.LuxMart.service.StoreService;

import java.nio.file.AccessDeniedException;

import org.apache.hc.core5.http.HttpHeaders;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@CrossOrigin(origins = "*")
@RestController
@RequiredArgsConstructor
@RequestMapping("/store")
public class StoreController {
    
    private final StoreService storeService;

@PostMapping("/register")  
public ResponseEntity<String> register(@ModelAttribute  StoreRegisterRequest request) {
    storeService.registerStore(request);
    return ResponseEntity.ok("register");
}

    @PostMapping("/login")
    public ResponseEntity<LoginResponseDto> login(@RequestBody @Valid LoginRequestDto loginRequestDto) {
        LoginResponseDto response = storeService.login(loginRequestDto);
        return ResponseEntity.ok(response);
    }

       @PostMapping("/logout")
    @PreAuthorize("hasRole('STORE')")
    public ResponseEntity<String> logout(HttpServletRequest request) {
        String authHeader = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            storeService.logout(token);
            return ResponseEntity.ok("Store logged out successfully");
        }
        return ResponseEntity.badRequest().body("No valid token provided");
    }

      @GetMapping("/info")
    @PreAuthorize("authentication.name == authentication.name")
    public ResponseEntity<StoreResponseDto> getStoreInfo()
            throws AccessDeniedException, java.nio.file.AccessDeniedException {
        StoreResponseDto dto = storeService.getCurrentStoreInfo();
        return ResponseEntity.ok(dto);
    }
    
}
