package com.shop.retailbackend.controller;

import com.shop.retailbackend.dto.order.CreateOrderRequest;
import com.shop.retailbackend.dto.order.CreateReservedOrderRequest;
import com.shop.retailbackend.dto.order.SaleOrderDto;
import com.shop.retailbackend.service.OnlineOrderService;
import com.shop.retailbackend.service.SaleOrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class SaleOrderController {

    private final SaleOrderService saleOrderService;
    private final OnlineOrderService onlineOrderService;

    @PostMapping
    public ResponseEntity<SaleOrderDto> createOrder(@Valid @RequestBody CreateOrderRequest request,
                                                     Authentication auth) {
        UUID sellerId = (UUID) auth.getPrincipal();
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(saleOrderService.createOrder(request, sellerId));
    }

    @PostMapping("/reserve")
    public ResponseEntity<SaleOrderDto> createReservedOrder(@Valid @RequestBody CreateReservedOrderRequest request,
                                                             Authentication auth) {
        UUID sellerId = (UUID) auth.getPrincipal();
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(saleOrderService.createReservedOrder(request, sellerId));
    }

    @PutMapping("/{id}/cancel")
    public ResponseEntity<Void> cancelOrder(@PathVariable UUID id, Authentication auth) {
        UUID sellerId = (UUID) auth.getPrincipal();
        saleOrderService.cancelOrder(id, sellerId);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/convert-to-pending")
    public ResponseEntity<SaleOrderDto> convertToPending(@PathVariable UUID id) {
        return ResponseEntity.ok(saleOrderService.convertToPending(id));
    }

    @GetMapping("/my")
    public ResponseEntity<List<SaleOrderDto>> myOrders(Authentication auth) {
        UUID sellerId = (UUID) auth.getPrincipal();
        return ResponseEntity.ok(saleOrderService.listMyOrders(sellerId));
    }

    @GetMapping("/pending")
    public ResponseEntity<List<SaleOrderDto>> pendingOrders() {
        return ResponseEntity.ok(saleOrderService.listPendingOrders());
    }

    @GetMapping("/reserved")
    public ResponseEntity<List<SaleOrderDto>> reservedOrders() {
        return ResponseEntity.ok(saleOrderService.listReservedOrders());
    }

    @GetMapping("/online/pending-verification")
    public ResponseEntity<List<com.shop.retailbackend.dto.onlineorder.OnlineOrderDto>> pendingVerification() {
        return ResponseEntity.ok(onlineOrderService.getPendingVerification());
    }
}
