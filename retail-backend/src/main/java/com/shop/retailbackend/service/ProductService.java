package com.shop.retailbackend.service;

import com.shop.retailbackend.dto.product.ProductOwnerDto;
import com.shop.retailbackend.dto.product.ProductPublicDto;
import com.shop.retailbackend.dto.product.ProductRequest;
import com.shop.retailbackend.entity.ExchangeRateSetting;
import com.shop.retailbackend.entity.Product;
import com.shop.retailbackend.exception.AppException;
import com.shop.retailbackend.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final ExchangeRateService exchangeRateService;

    @PreAuthorize("hasRole('OWNER')")
    @Transactional
    public ProductOwnerDto createProduct(ProductRequest request) {
        ExchangeRateSetting rate = exchangeRateService.getActiveRate();
        Product product = Product.builder()
                .name(request.getName())
                .description(request.getDescription())
                .category(request.getCategory())
                .price(request.getPrice())
                .buyingPrice(request.getBuyingPrice())
                .stockQuantity(request.getStockQuantity())
                .minStockAlert(request.getMinStockAlert())
                .imageUrl(request.getImageUrl())
                .isActive(true)
                .build();
        productRepository.save(product);
        return toOwnerDto(product, rate);
    }

    @PreAuthorize("hasRole('OWNER')")
    @Transactional
    public ProductOwnerDto updateProduct(UUID id, ProductRequest request) {
        Product product = getActiveProductOrThrow(id);
        ExchangeRateSetting rate = exchangeRateService.getActiveRate();

        product.setName(request.getName());
        product.setDescription(request.getDescription());
        product.setCategory(request.getCategory());
        product.setPrice(request.getPrice());
        product.setBuyingPrice(request.getBuyingPrice());
        product.setStockQuantity(request.getStockQuantity());
        product.setMinStockAlert(request.getMinStockAlert());
        product.setImageUrl(request.getImageUrl());

        productRepository.save(product);
        return toOwnerDto(product, rate);
    }

    @PreAuthorize("hasRole('OWNER')")
    @Transactional
    public void deactivateProduct(UUID id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Product not found"));
        if (!product.isActive()) {
            throw new AppException(HttpStatus.CONFLICT, "Product is already inactive");
        }
        product.setActive(false);
        productRepository.save(product);
    }

    public List<ProductOwnerDto> listAllForOwner() {
        ExchangeRateSetting rate = exchangeRateService.getActiveRate();
        return productRepository.findAllByIsActiveTrue().stream()
                .map(p -> toOwnerDto(p, rate))
                .collect(Collectors.toList());
    }

    public List<ProductPublicDto> listAllForPublic() {
        ExchangeRateSetting rate = exchangeRateService.getActiveRate();
        return productRepository.findAllByIsActiveTrue().stream()
                .map(p -> toPublicDto(p, rate))
                .collect(Collectors.toList());
    }

    @PreAuthorize("hasRole('OWNER')")
    public List<ProductOwnerDto> listLowStock() {
        ExchangeRateSetting rate = exchangeRateService.getActiveRate();
        return productRepository.findLowStockProducts().stream()
                .map(p -> toOwnerDto(p, rate))
                .collect(Collectors.toList());
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    public Product getActiveProductOrThrow(UUID id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Product not found"));
        if (!product.isActive()) {
            throw new AppException(HttpStatus.NOT_FOUND, "Product not found");
        }
        return product;
    }

    private ProductOwnerDto toOwnerDto(Product p, ExchangeRateSetting rate) {
        BigDecimal priceEtb = p.getPrice().divide(rate.getRate(), 2, RoundingMode.HALF_UP);
        BigDecimal profitKes = null;
        BigDecimal profitMargin = null;

        if (p.getBuyingPrice() != null) {
            profitKes = p.getPrice().subtract(p.getBuyingPrice());
            if (p.getPrice().compareTo(BigDecimal.ZERO) > 0) {
                profitMargin = profitKes
                        .divide(p.getPrice(), 4, RoundingMode.HALF_UP)
                        .multiply(BigDecimal.valueOf(100))
                        .setScale(2, RoundingMode.HALF_UP);
            }
        }

        return ProductOwnerDto.builder()
                .id(p.getId())
                .name(p.getName())
                .description(p.getDescription())
                .category(p.getCategory())
                .priceKes(p.getPrice())
                .priceEtb(priceEtb)
                .buyingPrice(p.getBuyingPrice())
                .profitKes(profitKes)
                .profitMarginPercent(profitMargin)
                .stockQuantity(p.getStockQuantity())
                .minStockAlert(p.getMinStockAlert())
                .lowStock(p.getStockQuantity() <= p.getMinStockAlert())
                .imageUrl(p.getImageUrl())
                .isActive(p.isActive())
                .currentExchangeRate(rate.getRate())
                .createdAt(p.getCreatedAt())
                .build();
    }

    private ProductPublicDto toPublicDto(Product p, ExchangeRateSetting rate) {
        BigDecimal priceEtb = p.getPrice().divide(rate.getRate(), 2, RoundingMode.HALF_UP);
        return ProductPublicDto.builder()
                .id(p.getId())
                .name(p.getName())
                .description(p.getDescription())
                .category(p.getCategory())
                .priceKes(p.getPrice())
                .priceEtb(priceEtb)
                .stockQuantity(p.getStockQuantity())
                .minStockAlert(p.getMinStockAlert())
                .lowStock(p.getStockQuantity() <= p.getMinStockAlert())
                .imageUrl(p.getImageUrl())
                .isActive(p.isActive())
                .currentExchangeRate(rate.getRate())
                .createdAt(p.getCreatedAt())
                .build();
    }
}
