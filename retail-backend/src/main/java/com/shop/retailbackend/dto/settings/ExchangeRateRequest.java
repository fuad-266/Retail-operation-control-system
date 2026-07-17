package com.shop.retailbackend.dto.settings;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class ExchangeRateRequest {

    @NotNull(message = "Rate is required")
    @DecimalMin(value = "0.000001", message = "Rate must be greater than 0")
    private BigDecimal rate;
}
