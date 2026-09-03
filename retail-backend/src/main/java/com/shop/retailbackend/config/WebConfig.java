package com.shop.retailbackend.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Paths;

@Configuration
@RequiredArgsConstructor
public class WebConfig implements WebMvcConfigurer {

    private final UploadProperties uploadProperties;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Serve product images at /uploads/products/**
        String productImagesPath = Paths.get(uploadProperties.getProductImagesDir())
                .toAbsolutePath().toUri().toString();
        registry.addResourceHandler("/uploads/products/**")
                .addResourceLocations(productImagesPath);

        // Serve screenshots at /uploads/screenshots/**
        String screenshotsPath = Paths.get(uploadProperties.getScreenshotsDir())
                .toAbsolutePath().toUri().toString();
        registry.addResourceHandler("/uploads/screenshots/**")
                .addResourceLocations(screenshotsPath);
    }
}
