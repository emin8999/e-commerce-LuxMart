package com.LuxMart.dto.responseDto;

import java.time.LocalDateTime;
import java.util.Set;

import com.LuxMart.enums.Roles;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserResponseDto {
 
    private Long id;
    private String email;
    private String name;
    private String surname;
    private String phone;
    private String address;
    private String gender; 
    private Set<Roles> roles;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
}
