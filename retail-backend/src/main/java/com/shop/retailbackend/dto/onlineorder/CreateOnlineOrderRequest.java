package com.shop.retailbackend.dto.onlineorder;

import com.shop.retailbackend.dto.order.OrderItemRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

@Data
public class CreateOnlineOrderRequest {

    @NotEmpty(message = "Order must contain at least one item")
    @Valid
    private List<OrderItemRequest> items;

    @NotBlank(message = "Delivery address is required")
    private String deliveryAddress;

    // Optional: "MESSENGER" causes MESSENGER_PENDING status (no screenshot needed).
    // Omitting or any other value → PENDING_PAYMENT (screenshot required).
    private String paymentMethod;
}
