package com.shop.retailbackend.controller;

import com.shop.retailbackend.dto.product.ProductOwnerDto;
import com.shop.retailbackend.dto.product.ProductPublicDto;
import com.shop.retailbackend.dto.product.ProductRequest;
import com.shop.retailbackend.entity.Role;
import com.shop.retailbackend.service.ProductService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    @GetMapping
    public ResponseEntity<?> listProducts(Authentication auth) {
        boolean isOwner = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_OWNER"));
        if (isOwner) {
            List<ProductOwnerDto> products = productService.listAllForOwner();
            return ResponseEntity.ok(products);
        }
        List<ProductPublicDto> products = productService.listAllForPublic();
        return ResponseEntity.ok(products);
    }

    @PostMapping
    public ResponseEntity<ProductOwnerDto> createProduct(@Valid @RequestBody ProductRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(productService.createProduct(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProductOwnerDto> updateProduct(@PathVariable UUID id,
                                                          @Valid @RequestBody ProductRequest request) {
        return ResponseEntity.ok(productService.updateProduct(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deactivateProduct(@PathVariable UUID id) {
        productService.deactivateProduct(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/low-stock")
    public ResponseEntity<List<ProductOwnerDto>> lowStock() {
        return ResponseEntity.ok(productService.listLowStock());
    }
}
