package com.LuxMart.dto.requestDto.user;

import java.util.List;

import com.LuxMart.enums.Roles;

import jakarta.validation.constraints.NotEmpty;
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
public class BulkRoleRequest {

    @NotNull(message = "Role is required")
    private Roles role;
    private String note;
    
    @NotEmpty(message = "User IDs are required")
    private List<Long> ids;
    
}
