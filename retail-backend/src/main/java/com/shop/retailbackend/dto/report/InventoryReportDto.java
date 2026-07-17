package com.shop.retailbackend.dto.report;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class InventoryReportDto {

    private List<ProductStockDto> products;

    @Data
    @Builder
    public static class ProductStockDto {
        private String id;
        private String name;
        private String category;
        private int stockQuantity;
        private int minStockAlert;
        private boolean isLowStock;
    }
}
