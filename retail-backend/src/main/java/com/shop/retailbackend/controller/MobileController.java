package com.shop.retailbackend.controller;

import com.shop.retailbackend.dto.onlineorder.CreateOnlineOrderRequest;
import com.shop.retailbackend.dto.onlineorder.OnlineOrderDto;
import com.shop.retailbackend.dto.product.ProductPublicDto;
import com.shop.retailbackend.entity.OnlineOrderStatus;
import com.shop.retailbackend.service.OnlineOrderService;
import com.shop.retailbackend.service.ProductService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/mobile")
@RequiredArgsConstructor
public class MobileController {

    private final OnlineOrderService onlineOrderService;
    private final ProductService productService;

    // Products for mobile (CUSTOMER — no buying_price)
    @GetMapping("/products")
    public ResponseEntity<List<ProductPublicDto>> listProducts() {
        return ResponseEntity.ok(productService.listAllForPublic());
    }

    // Place an online order
    @PostMapping("/orders")
    public ResponseEntity<OnlineOrderDto> createOrder(@Valid @RequestBody CreateOnlineOrderRequest request,
                                                       Authentication auth) {
        UUID customerId = (UUID) auth.getPrincipal();
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(onlineOrderService.createOrder(request, customerId));
    }

    // Upload payment screenshot
    @PostMapping(value = "/orders/{id}/submit-payment", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<OnlineOrderDto> submitPayment(@PathVariable UUID id,
                                                         @RequestPart("screenshot") MultipartFile screenshot,
                                                         @RequestParam(required = false) String paymentReference,
                                                         Authentication auth) {
        UUID customerId = (UUID) auth.getPrincipal();
        return ResponseEntity.ok(
                onlineOrderService.submitPaymentScreenshot(id, customerId, screenshot, paymentReference));
    }

    // Get screenshot image (CASHIER / OWNER only — enforced in service)
    @GetMapping("/orders/{id}/screenshot")
    public ResponseEntity<Resource> getScreenshot(@PathVariable UUID id) {
        Resource resource = onlineOrderService.getScreenshot(id);
        return ResponseEntity.ok()
                .contentType(MediaType.IMAGE_JPEG)
                .body(resource);
    }

    // Customer: my orders
    @GetMapping("/orders/my")
    public ResponseEntity<List<OnlineOrderDto>> myOrders(Authentication auth) {
        UUID customerId = (UUID) auth.getPrincipal();
        return ResponseEntity.ok(onlineOrderService.getMyOrders(customerId));
    }

    // Customer: single order
    @GetMapping("/orders/{id}")
    public ResponseEntity<OnlineOrderDto> getOrder(@PathVariable UUID id, Authentication auth) {
        UUID customerId = (UUID) auth.getPrincipal();
        return ResponseEntity.ok(onlineOrderService.getOrder(id, customerId));
    }
}
