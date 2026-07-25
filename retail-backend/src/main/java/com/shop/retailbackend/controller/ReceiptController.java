package com.shop.retailbackend.controller;

import com.shop.retailbackend.dto.payment.ReceiptDto;
import com.shop.retailbackend.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/receipts")
@RequiredArgsConstructor
public class ReceiptController {

    private final PaymentService paymentService;

    @GetMapping("/today")
    public ResponseEntity<List<ReceiptDto>> getTodayReceipts() {
        return ResponseEntity.ok(paymentService.getTodayReceipts());
    }

    @GetMapping("/{receiptNumber}")
    public ResponseEntity<ReceiptDto> getReceipt(@PathVariable String receiptNumber) {
        return ResponseEntity.ok(paymentService.getReceipt(receiptNumber));
    }

    @PutMapping("/{receiptNumber}/fulfill")
    public ResponseEntity<ReceiptDto> fulfill(@PathVariable String receiptNumber) {
        return ResponseEntity.ok(paymentService.fulfillReceipt(receiptNumber));
    }
}
