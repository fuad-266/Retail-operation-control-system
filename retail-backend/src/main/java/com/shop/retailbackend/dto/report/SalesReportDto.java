package com.shop.retailbackend.dto.report;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
public class SalesReportDto {

    private int totalOrders;
    private BigDecimal totalRevenueKes;
    private BigDecimal totalRevenueEtb;
    private List<DailySaleDto> breakdown;

    @Data
    @Builder
    public static class DailySaleDto {
        private String date;
        private int orderCount;
        private BigDecimal revenueKes;
    }
}
