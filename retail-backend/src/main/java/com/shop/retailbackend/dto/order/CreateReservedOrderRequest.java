package com.shop.retailbackend.dto.order;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

@Data
public class CreateReservedOrderRequest {

    @NotEmpty(message = "Order must contain at least one item")
    @Valid
    private List<OrderItemRequest> items;

    @NotBlank(message = "Customer name is required for reservations")
    private String reservedForName;

    @NotBlank(message = "Customer phone is required for reservations")
    private String reservedForPhone;
}
