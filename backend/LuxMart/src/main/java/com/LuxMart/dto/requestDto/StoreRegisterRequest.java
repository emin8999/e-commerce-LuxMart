package com.LuxMart.dto.requestDto;

import org.springframework.web.multipart.MultipartFile;

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
public class StoreRegisterRequest {

   private String storeName;
    private String ownerName;
    private String email;  
    private String password;     
    private String confirmPassword;
    private String storeDescription;
    private MultipartFile logo;
    private String phone;
    private String location;
    private String category;
    private Boolean agreedToTerms;
    
}
