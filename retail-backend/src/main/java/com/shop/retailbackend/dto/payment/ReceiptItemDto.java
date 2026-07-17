package com.shop.retailbackend.dto.payment;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
public class ReceiptItemDto {

    private UUID productId;
    private String productName;
    private int quantity;
    private BigDecimal unitPrice;   // null when receipt_show_item_prices = false
}
