package com.shop.retailbackend.controller;

import com.shop.retailbackend.dto.payment.ConfirmPaymentRequest;
import com.shop.retailbackend.dto.payment.ReceiptDto;
import com.shop.retailbackend.service.OnlineOrderService;
import com.shop.retailbackend.service.PaymentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;
    private final OnlineOrderService onlineOrderService;

    @PostMapping("/confirm/{orderId}")
    public ResponseEntity<ReceiptDto> confirmPayment(@PathVariable UUID orderId,
                                                      @Valid @RequestBody ConfirmPaymentRequest request,
                                                      Authentication auth) {
        UUID confirmerId = (UUID) auth.getPrincipal();
        return ResponseEntity.ok(paymentService.confirmPayment(orderId, request, confirmerId));
    }

    @PostMapping("/confirm-online/{orderId}")
    public ResponseEntity<ReceiptDto> confirmOnlinePayment(@PathVariable UUID orderId,
                                                            @Valid @RequestBody ConfirmPaymentRequest request,
                                                            Authentication auth) {
        UUID confirmerId = (UUID) auth.getPrincipal();
        return ResponseEntity.ok(onlineOrderService.confirmOnlinePayment(orderId, request, confirmerId));
    }

    @PostMapping("/reject-online/{orderId}")
    public ResponseEntity<Void> rejectOnlinePayment(@PathVariable UUID orderId,
                                                     @RequestBody RejectPaymentRequest request,
                                                     Authentication auth) {
        onlineOrderService.rejectOnlinePayment(orderId, request.getReason());
        return ResponseEntity.noContent().build();
    }

    @lombok.Data
    static class RejectPaymentRequest {
        private String reason;
    }
}
