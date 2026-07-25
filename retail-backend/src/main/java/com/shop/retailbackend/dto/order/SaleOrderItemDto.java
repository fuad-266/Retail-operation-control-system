package com.shop.retailbackend.dto.order;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
public class SaleOrderItemDto {

    private UUID id;
    private UUID productId;
    private String productName;
    private int quantity;
    private BigDecimal unitPriceKes;
    private BigDecimal unitPriceEtb;
    private BigDecimal subtotalKes;
    private BigDecimal subtotalEtb;
}
