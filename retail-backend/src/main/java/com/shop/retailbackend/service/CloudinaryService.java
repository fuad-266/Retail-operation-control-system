package com.shop.retailbackend.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class CloudinaryService {

    private final Cloudinary cloudinary;

    public String uploadImage(MultipartFile file, String folder) throws IOException {
        Map params = ObjectUtils.asMap(
            "folder", folder,
            "resource_type", "auto"
        );

        Map uploadResult = cloudinary.uploader().upload(file.getBytes(), params);
        
        // Return the secure cloud URL
        return uploadResult.get("secure_url").toString();
    }
}
