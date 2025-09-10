package com.LuxMart.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.LuxMart.dto.requestDto.LoginRequestDto;
import com.LuxMart.dto.responseDto.LoginResponseDto;
import com.LuxMart.service.UserService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {
 
    private final UserService userService;

      @PostMapping("/login")
    public ResponseEntity<LoginResponseDto> adminLogin(@RequestBody @Valid LoginRequestDto loginRequestDto) {
        LoginResponseDto response = userService.adminLogin(loginRequestDto);
        return ResponseEntity.ok(response);
    }
}
