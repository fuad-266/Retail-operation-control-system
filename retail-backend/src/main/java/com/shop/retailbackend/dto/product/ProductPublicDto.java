package com.shop.retailbackend.dto.product;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Product response for non-OWNER roles — buying_price is excluded.
 */
@Data
@Builder
public class ProductPublicDto {

    private UUID id;
    private String name;
    private String description;
    private String category;
    private BigDecimal priceKes;
    private BigDecimal priceEtb;
    private int stockQuantity;
    private int minStockAlert;
    private boolean lowStock;
    private String imageUrl;
    private boolean isActive;
    private BigDecimal currentExchangeRate;
    private LocalDateTime createdAt;
}
