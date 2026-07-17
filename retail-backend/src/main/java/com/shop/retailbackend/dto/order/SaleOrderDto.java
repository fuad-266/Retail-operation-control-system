package com.shop.retailbackend.dto.order;

import com.shop.retailbackend.entity.SaleOrderStatus;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class SaleOrderDto {

    private UUID id;
    private UUID sellerId;
    private String sellerName;
    private SaleOrderStatus status;
    private BigDecimal totalAmount;     // KES
    private String reservedForName;
    private String reservedForPhone;
    private LocalDateTime reservationExpiresAt;
    private String cancellationReason;
    private LocalDateTime createdAt;
    private List<SaleOrderItemDto> items;
}
