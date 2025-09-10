package com.LuxMart.service.impl;

import java.util.Set;

import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.LuxMart.dto.requestDto.LoginRequestDto;
import com.LuxMart.dto.requestDto.RegisterRequestDto;
import com.LuxMart.dto.requestDto.UserUpdateRequestDto;
import com.LuxMart.dto.responseDto.LoginResponseDto;
import com.LuxMart.dto.responseDto.RegisterResponseDto;
import com.LuxMart.dto.responseDto.UserResponseDto;
import com.LuxMart.entity.UserEntity;
import com.LuxMart.enums.Roles;
import com.LuxMart.exception.EmailAlreadyExistsException;
import com.LuxMart.exception.PasswordMismatchException;
import com.LuxMart.exception.UserNotFoundException;
import com.LuxMart.mapper.UserMapper;
import com.LuxMart.repository.UserRepository;
import com.LuxMart.security.jwt.JwtService;
import com.LuxMart.security.user.UserPrincipal;
import com.LuxMart.service.TokenBlacklistService;
import com.LuxMart.service.UserService;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final BCryptPasswordEncoder bCryptPasswordEncoder;
    private final UserMapper userMapper;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final TokenBlacklistService tokenBlacklistService;
    

     @Override
    public RegisterResponseDto register(RegisterRequestDto registerRequestDto) {
        if (userRepository.existsByEmail(registerRequestDto.getEmail())) {
            throw new EmailAlreadyExistsException("email exist");
        }

        if (!registerRequestDto.getPassword().equals(registerRequestDto.getPassword())) {
            throw new PasswordMismatchException();
        }

        UserEntity user = userMapper.mapToUser(registerRequestDto);
        user.setPassword(bCryptPasswordEncoder.encode(user.getPassword()));

        if (user.getRoles() == null || user.getRoles().isEmpty()) {
            user.setRoles(Set.of(Roles.CLIENT));
        }

        userRepository.save(user);

        RegisterResponseDto response = userMapper.mapToRegisterResponseDto(user);
        response.setMessage("User registered successfully");
        return response;
    }


    @Override
    public LoginResponseDto login(LoginRequestDto loginRequestDto) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequestDto.getEmail(), loginRequestDto.getPassword())
        );

        if (authentication.isAuthenticated()) {
            UserEntity user = userRepository.findByEmail(loginRequestDto.getEmail())
                    .orElseThrow(() -> new UserNotFoundException());

            UserPrincipal userPrincipal = new UserPrincipal(user);
            String token = jwtService.generateToken(userPrincipal);

            return new LoginResponseDto(token, "Bearer");
        } else {
            throw new RuntimeException("Authentication failed");
        }
    }

   @Override
    public LoginResponseDto adminLogin(LoginRequestDto loginRequestDto) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequestDto.getEmail(), loginRequestDto.getPassword())
        );

        if (authentication.isAuthenticated()) {
            UserEntity user = userRepository.findByEmail(loginRequestDto.getEmail())
                    .orElseThrow(() -> new UserNotFoundException());

            if (!user.getRoles().contains(Roles.ADMIN)) {
                throw new RuntimeException("Access denied: Admin role required");
            }

            UserPrincipal userPrincipal = new UserPrincipal(user);
            String token = jwtService.generateToken(userPrincipal);

            return new LoginResponseDto(token, "Bearer");
        } else {
            throw new RuntimeException("Authentication failed");
        }
    }

     @Override
    public void logout(String token) {
        tokenBlacklistService.blacklistToken(token);
        SecurityContextHolder.clearContext();
    }


    @Override
    @Transactional(readOnly = true)
    public UserResponseDto getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        UserEntity user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return userMapper.mapToUserResponseDto(user);
    }
 
    @Override
    @Transactional
    public void updateUser(Long userId, UserUpdateRequestDto dto) {
    Authentication auth = SecurityContextHolder.getContext().getAuthentication();
    UserDetails userDetails = (UserDetails) auth.getPrincipal();

    String currentUserEmail = userDetails.getUsername();

    UserEntity user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));

    if (!user.getEmail().equals(currentUserEmail)) {
        throw new RuntimeException("Access denied: You can only update your own data");
    }

    if (dto.getName() != null) user.setName(dto.getName());
    if (dto.getPassword() != null) user.setPassword(bCryptPasswordEncoder.encode(dto.getPassword()));
    if (dto.getSurname() != null) user.setSurname(dto.getSurname());
    if (dto.getAddress() != null) user.setAddress(dto.getAddress());
    if (dto.getPhone() != null) user.setPhone(dto.getPhone());

    userRepository.save(user);
}

}
