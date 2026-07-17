package com.shop.retailbackend.dto.onlineorder;

import com.shop.retailbackend.entity.OnlineOrderStatus;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class OnlineOrderDto {

    private UUID id;
    private UUID customerId;
    private String customerName;
    private OnlineOrderStatus status;
    private BigDecimal totalAmount;
    private String deliveryAddress;
    private String paymentScreenshotUrl;
    private String paymentReference;
    private String rejectionReason;
    private String paymentInstructions;   // sourced from shop settings on creation
    private LocalDateTime createdAt;
    private List<OnlineOrderItemDto> items;
}
