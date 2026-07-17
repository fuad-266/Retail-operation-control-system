package com.shop.retailbackend.dto.payment;

import com.shop.retailbackend.entity.PaymentMethod;
import com.shop.retailbackend.entity.ReceiptStatus;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class ReceiptDto {

    private UUID id;
    private String receiptNumber;
    private UUID orderId;           // set for in-store orders
    private UUID onlineOrderId;     // set for online orders
    private UUID confirmedById;
    private String confirmedByName;
    private BigDecimal totalAmount; // KES
    private BigDecimal amount;      // in paymentCurrency
    private String paymentCurrency;
    private PaymentMethod paymentMethod;
    private ReceiptStatus status;
    private List<ReceiptItemDto> items;
    private LocalDateTime createdAt;
    // exchangeRateUsed is intentionally excluded
}
