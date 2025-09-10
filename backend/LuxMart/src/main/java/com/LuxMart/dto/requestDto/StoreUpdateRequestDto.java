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
public class StoreUpdateRequestDto {

    private String storeName;
    private String ownerName;
    private String password;
    private String storeDescription;
    private String phone;
    private String location;
    private String category;
    private MultipartFile logo;
}
