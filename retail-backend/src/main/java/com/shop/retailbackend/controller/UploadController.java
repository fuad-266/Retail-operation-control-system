package com.shop.retailbackend.controller;

import com.shop.retailbackend.config.UploadProperties;
import com.shop.retailbackend.exception.AppException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@RestController
@RequestMapping("/api/uploads")
@RequiredArgsConstructor
public class UploadController {

    private final UploadProperties uploadProperties;
    private final com.shop.retailbackend.service.CloudinaryService cloudinaryService;

    private static final Set<String> ALLOWED_TYPES = Set.of(
            "image/jpeg", "image/png", "image/webp", "image/gif");
    private static final long MAX_SIZE = 5 * 1024 * 1024; // 5 MB

    @PostMapping("/product-image")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<?> uploadProductImage(@RequestParam("file") MultipartFile file) {
        // Validate
        if (file.isEmpty()) {
            throw new AppException(HttpStatus.BAD_REQUEST, "No file provided.");
        }
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_TYPES.contains(contentType)) {
            throw new AppException(HttpStatus.BAD_REQUEST,
                    "Invalid file type. Allowed: JPG, PNG, WebP, GIF.");
        }
        if (file.getSize() > MAX_SIZE) {
            throw new AppException(HttpStatus.BAD_REQUEST,
                    "File too large. Maximum size is 5 MB.");
        }

        try {
            String secureUrl = cloudinaryService.uploadImage(file, "retail/products");
            return ResponseEntity.ok(Map.of("imageUrl", secureUrl));

        } catch (IOException e) {
            throw new AppException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "Failed to save image: " + e.getMessage());
        }
    }
}
