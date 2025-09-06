package com.LuxMart.utility;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import com.LuxMart.cloudinary.CloudinaryService;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class ProductUtility {

    private final CloudinaryService cloudinaryService;

    public List<String> saveProductImages(List<MultipartFile> images, Long storeId, Long productId) {
        List<String> imageUrls = new ArrayList<>();
        String folderPath = "image/store_" + storeId + "/product_" + productId;

        for (int i = 0; i < images.size(); i++) {
            MultipartFile image = images.get(i);
            String publicId = "product_" + i;
            String imageUrl = cloudinaryService.uploadFile(image, folderPath, publicId);
            imageUrls.add(imageUrl);
        }

        return imageUrls;
    }
}
