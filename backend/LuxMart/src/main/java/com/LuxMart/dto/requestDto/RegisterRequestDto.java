package com.LuxMart.dto.requestDto;

import com.LuxMart.enums.Gender;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
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
public class RegisterRequestDto {

    @NotBlank(message = "Name is required")
    @Size(min = 2, max = 50, message = "Name must be between 2 and 50 characters")
    private String name;

     @NotBlank(message = "Surname is required")
    @Size(min = 2, max = 50, message = "Surname must be between 2 and 50 characters")
    private String surname;

    @Email(message = "Email should be valid")
    @NotBlank(message = "Email is required")
    @Size(min = 6, message = "Email must be at least 6 characters")
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 5, max = 64, message = "Password must be between 10 and 64 characters")
    private String password;

    @NotBlank(message = "Password confirmation is required")
    private String confirmPassword;

    @Size(max = 500, message = "Address cannot exceed 500 characters")
    private String address;

    @Pattern(regexp = "\\+?[0-9]{7,15}", message = "Phone number is invalid")
    private String phone;

    private Gender gender;

    @NotNull(message = "Consent for membership agreement must be given")
    private Boolean consentMembershipAgreement;


}

