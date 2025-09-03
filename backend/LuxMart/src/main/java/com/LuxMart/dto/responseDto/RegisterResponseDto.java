package com.LuxMart.dto.responseDto;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class RegisterResponseDto {

    private Long id;
    private String name;
    private String email;
    private String address;
    private String phone;
    private LocalDateTime createdAt;
    private String message;

}
