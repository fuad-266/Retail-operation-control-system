package com.shop.retailbackend.dto.report;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
public class SellerReportDto {

    private UUID sellerId;
    private String sellerName;
    private int orderCount;
    private BigDecimal totalRevenueKes;
    private BigDecimal totalRevenueEtb;
}
