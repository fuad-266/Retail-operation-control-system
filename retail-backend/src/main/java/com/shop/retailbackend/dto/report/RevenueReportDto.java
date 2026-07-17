package com.shop.retailbackend.dto.report;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class RevenueReportDto {

    private BigDecimal totalRevenueKes;
    private BigDecimal totalRevenueEtb;
    private BigDecimal cogs;               // sum of buying_price × quantity (products with buyingPrice set)
    private BigDecimal profit;             // revenue - cogs
    private BigDecimal profitMarginPercent;
}
