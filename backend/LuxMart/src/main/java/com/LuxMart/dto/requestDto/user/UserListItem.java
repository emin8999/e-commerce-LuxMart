package com.LuxMart.dto.requestDto.user;

import java.time.LocalDateTime;
import java.util.Set;

import com.LuxMart.enums.Roles;
import com.fasterxml.jackson.annotation.JsonFormat;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserListItem {
    private Long id;
    private String name;
    private String surname;
    private String email;
    private String phone;
    private String address;
    
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime createdAt;
    
    private Integer ordersCount;
    private Double spendUSD;
    private Set<Roles> roles;
    private boolean isActive; 
}
