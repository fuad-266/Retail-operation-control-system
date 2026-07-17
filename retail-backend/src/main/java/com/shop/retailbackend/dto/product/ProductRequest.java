package com.shop.retailbackend.dto.product;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class ProductRequest {

    @NotBlank(message = "Product name is required")
    private String name;

    private String description;

    private String category;

    @NotNull(message = "Price is required")
    @DecimalMin(value = "0.01", message = "Price must be greater than 0")
    private BigDecimal price;   // KES

    @DecimalMin(value = "0.00", message = "Buying price must be >= 0")
    private BigDecimal buyingPrice;   // KES, optional

    @Min(value = 0, message = "Stock quantity must be >= 0")
    private int stockQuantity;

    @Min(value = 0, message = "Min stock alert must be >= 0")
    private int minStockAlert;

    private String imageUrl;
}
