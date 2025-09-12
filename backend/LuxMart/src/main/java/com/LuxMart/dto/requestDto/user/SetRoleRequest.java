package com.LuxMart.dto.requestDto.user;

import com.LuxMart.enums.Roles;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Builder
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class SetRoleRequest {

    @NotNull(message = "Role is required")
    private Roles role; // ADMIN, CLIENT, STORE_OWNER
    private String note;
    
}