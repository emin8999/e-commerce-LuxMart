package com.LuxMart.utility;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@Component
@Slf4j
public class ProductUtility {

    private final String baseDir = "uploads/products"; 

    /**
     * Məhsul üçün şəkil saxlayır və URL qaytarır
     *
     * @param file      MultipartFile
     * @param storeId   Store ID
     * @param productId Product ID
     * @return Faylın URL və ya path-i
     */
    public String saveProductImage(MultipartFile file, Long storeId, Long productId) {
        try {
           
            Path dirPath = Paths.get(baseDir, storeId.toString(), productId.toString());
            if (!Files.exists(dirPath)) {
                Files.createDirectories(dirPath);
            }

            String originalFilename = file.getOriginalFilename();
            String extension = "";
            if (originalFilename != null && originalFilename.contains(".")) {
                extension = originalFilename.substring(originalFilename.lastIndexOf("."));
            }
            String filename = UUID.randomUUID().toString() + extension;

            Path filePath = dirPath.resolve(filename);
            file.transferTo(filePath.toFile());

            return "/uploads/products/" + storeId + "/" + productId + "/" + filename;

        } catch (IOException e) {
            log.error("Failed to save product image", e);
            throw new RuntimeException("Failed to save product image", e);
        }
    }
}
