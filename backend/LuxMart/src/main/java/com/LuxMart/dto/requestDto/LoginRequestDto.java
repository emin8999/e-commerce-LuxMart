package com.LuxMart.dto.requestDto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
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
public class LoginRequestDto {

    @Email(message = "Email should be valid")
    @NotBlank(message = "Email is required")
    @Size(min = 6, message = "Email must be at least 6 characters")
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 10, max = 64, message = "Password must be between 10 and 64 characters")
    private String password;

}
