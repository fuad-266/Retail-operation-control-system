package com.shop.retailbackend.dto.payment;

import com.shop.retailbackend.entity.PaymentMethod;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class ConfirmPaymentRequest {

    @NotNull(message = "Payment method is required")
    private PaymentMethod paymentMethod;

    @NotBlank(message = "Payment currency is required")
    @Pattern(regexp = "KES|ETB", message = "Payment currency must be KES or ETB")
    private String paymentCurrency;
}
