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
            Path uploadDir = Paths.get(uploadProperties.getProductImagesDir());
            Files.createDirectories(uploadDir);

            // Generate a unique filename
            String originalName = file.getOriginalFilename();
            String extension = "";
            if (originalName != null && originalName.contains(".")) {
                extension = originalName.substring(originalName.lastIndexOf("."));
            }
            String filename = UUID.randomUUID() + extension;

            // Save to disk
            file.transferTo(uploadDir.resolve(filename));

            // Return the URL path (relative to the backend base)
            String imageUrl = "/uploads/products/" + filename;
            return ResponseEntity.ok(Map.of("imageUrl", imageUrl));

        } catch (IOException e) {
            throw new AppException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "Failed to save image: " + e.getMessage());
        }
    }
}
