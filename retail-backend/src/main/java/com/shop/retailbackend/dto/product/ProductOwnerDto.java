package com.shop.retailbackend.dto.product;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Full product response for OWNER — includes buying_price, profit, and margin.
 */
@Data
@Builder
public class ProductOwnerDto {

    private UUID id;
    private String name;
    private String description;
    private String category;
    private BigDecimal priceKes;
    private BigDecimal priceEtb;
    private BigDecimal buyingPrice;
    private BigDecimal profitKes;           // price - buyingPrice (null if buyingPrice null)
    private BigDecimal profitMarginPercent; // (profit / price) * 100 (null if buyingPrice null)
    private int stockQuantity;
    private int minStockAlert;
    private boolean lowStock;
    private String imageUrl;
    private boolean isActive;
    private BigDecimal currentExchangeRate;
    private LocalDateTime createdAt;
}
