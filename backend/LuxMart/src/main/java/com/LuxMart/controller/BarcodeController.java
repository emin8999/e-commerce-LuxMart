package com.LuxMart.controller;

import java.security.SecureRandom;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/barcode")
public class BarcodeController {

    private final SecureRandom random = new SecureRandom();

    @GetMapping("/new")
    public ResponseEntity<Map<String, String>> generate() {
        String code = generateEAN13();
        return ResponseEntity.ok(Map.of("barcode", code));
    }

    private String generateEAN13() {
        int[] digits = new int[12];
        // Optional GS1 prefix (2xx for internal use). We'll just randomize all for simplicity.
        for (int i = 0; i < 12; i++) {
            digits[i] = random.nextInt(10);
        }
        int checksum = ean13Checksum(digits);
        StringBuilder sb = new StringBuilder(13);
        for (int d : digits) sb.append(d);
        sb.append(checksum);
        return sb.toString();
    }

    private int ean13Checksum(int[] d) {
        // d[0]..d[11] are the first 12 digits from left to right
        int sum = 0;
        for (int i = 0; i < 12; i++) {
            int weight = (i % 2 == 0) ? 1 : 3; // positions 1,3,5... weight 1; 2,4,6... weight 3
            sum += d[i] * weight;
        }
        return (10 - (sum % 10)) % 10;
    }
}

