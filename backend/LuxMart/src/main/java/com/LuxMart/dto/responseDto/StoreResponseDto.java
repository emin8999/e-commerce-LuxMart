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
public class StoreResponseDto {

    
    private Long id;

    private String storeName;

    private String ownerName;

    private String slug;

    private String email;

    private String storeDescription;

    private String logo;

    private String phone;

    private String location;

    private String category;

    private Boolean agreedToTerms;

    private Set<Roles> roles;

    private LocalDateTime createdAt;

    private LocalDateTime updateAt;
}
