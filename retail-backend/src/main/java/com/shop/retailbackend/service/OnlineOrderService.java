package com.shop.retailbackend.service;

import com.shop.retailbackend.config.UploadProperties;
import com.shop.retailbackend.dto.onlineorder.CreateOnlineOrderRequest;
import com.shop.retailbackend.dto.onlineorder.OnlineOrderDto;
import com.shop.retailbackend.dto.onlineorder.OnlineOrderItemDto;
import com.shop.retailbackend.dto.payment.ConfirmPaymentRequest;
import com.shop.retailbackend.dto.payment.ReceiptDto;
import com.shop.retailbackend.entity.*;
import com.shop.retailbackend.exception.AppException;
import com.shop.retailbackend.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpStatus;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class OnlineOrderService {

    private final OnlineOrderRepository onlineOrderRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final ReceiptRepository receiptRepository;
    private final ShopSettingRepository shopSettingRepository;
    private final ExchangeRateService exchangeRateService;
    private final PaymentService paymentService;
    private final UploadProperties uploadProperties;

    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024L; // 5 MB
    private static final List<String> ALLOWED_TYPES = List.of("image/jpeg", "image/png");

    // ── Customer: place order ─────────────────────────────────────────────

    @PreAuthorize("hasRole('CUSTOMER')")
    @Transactional
    public OnlineOrderDto createOrder(CreateOnlineOrderRequest request, UUID customerId) {
        User customer = getUserOrThrow(customerId);

        BigDecimal total = BigDecimal.ZERO;
        OnlineOrder order = OnlineOrder.builder()
                .customer(customer)
                .status(OnlineOrderStatus.PENDING_PAYMENT)
                .deliveryAddress(request.getDeliveryAddress())
                .totalAmount(BigDecimal.ZERO)
                .build();

        for (var itemReq : request.getItems()) {
            Product product = getActiveProductOrThrow(itemReq.getProductId());
            BigDecimal unitPrice = product.getPrice();
            total = total.add(unitPrice.multiply(BigDecimal.valueOf(itemReq.getQuantity())));

            OnlineOrderItem item = OnlineOrderItem.builder()
                    .onlineOrder(order)
                    .product(product)
                    .quantity(itemReq.getQuantity())
                    .unitPrice(unitPrice)
                    .build();
            order.getItems().add(item);
        }
        order.setTotalAmount(total);
        onlineOrderRepository.save(order);

        String instructions = buildPaymentInstructions();
        return toDto(order, instructions);
    }

    // ── Customer: submit payment screenshot ──────────────────────────────

    @PreAuthorize("hasRole('CUSTOMER')")
    @Transactional
    public OnlineOrderDto submitPaymentScreenshot(UUID orderId, UUID customerId,
                                                   MultipartFile screenshot, String paymentReference) {
        OnlineOrder order = getOrderOrThrow(orderId);
        ensureCustomerOwns(order, customerId);

        if (order.getStatus() != OnlineOrderStatus.PENDING_PAYMENT
                && order.getStatus() != OnlineOrderStatus.PAYMENT_REJECTED) {
            throw new AppException(HttpStatus.CONFLICT,
                    "Cannot submit screenshot for order in status: " + order.getStatus());
        }

        validateScreenshot(screenshot);

        String filename = UUID.randomUUID() + getExtension(screenshot.getContentType());
        Path uploadDir = Paths.get(uploadProperties.getScreenshotsDir());
        try {
            Files.createDirectories(uploadDir);
            screenshot.transferTo(uploadDir.resolve(filename));
        } catch (IOException e) {
            log.error("Failed to store screenshot", e);
            throw new AppException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to store screenshot");
        }

        order.setPaymentScreenshotUrl(filename);
        order.setPaymentReference(paymentReference);
        order.setStatus(OnlineOrderStatus.SCREENSHOT_SUBMITTED);
        order.setRejectionReason(null);  // clear previous rejection
        onlineOrderRepository.save(order);

        return toDto(order, null);
    }

    // ── Cashier/Owner: get screenshot image ──────────────────────────────

    @PreAuthorize("hasAnyRole('CASHIER','OWNER')")
    public Resource getScreenshot(UUID orderId) {
        OnlineOrder order = getOrderOrThrow(orderId);
        if (order.getPaymentScreenshotUrl() == null) {
            throw new AppException(HttpStatus.NOT_FOUND, "No screenshot found for this order");
        }
        try {
            Path file = Paths.get(uploadProperties.getScreenshotsDir())
                    .resolve(order.getPaymentScreenshotUrl());
            Resource resource = new UrlResource(file.toUri());
            if (!resource.exists() || !resource.isReadable()) {
                throw new AppException(HttpStatus.NOT_FOUND, "Screenshot file not found");
            }
            return resource;
        } catch (IOException e) {
            throw new AppException(HttpStatus.INTERNAL_SERVER_ERROR, "Could not read screenshot");
        }
    }

    // ── Customer: my orders ───────────────────────────────────────────────

    @PreAuthorize("hasRole('CUSTOMER')")
    public List<OnlineOrderDto> getMyOrders(UUID customerId) {
        return onlineOrderRepository.findAllByCustomerId(customerId).stream()
                .map(o -> toDto(o, null))
                .collect(Collectors.toList());
    }

    // ── Customer: single order ────────────────────────────────────────────

    @PreAuthorize("hasRole('CUSTOMER')")
    public OnlineOrderDto getOrder(UUID orderId, UUID customerId) {
        OnlineOrder order = getOrderOrThrow(orderId);
        ensureCustomerOwns(order, customerId);
        return toDto(order, null);
    }

    // ── Cashier/Owner: pending verification queue ─────────────────────────

    @PreAuthorize("hasAnyRole('CASHIER','OWNER')")
    public List<OnlineOrderDto> getPendingVerification() {
        return onlineOrderRepository.findAllByStatus(OnlineOrderStatus.SCREENSHOT_SUBMITTED).stream()
                .map(o -> toDto(o, null))
                .collect(Collectors.toList());
    }

    // ── Cashier/Owner: confirm online payment ─────────────────────────────

    @PreAuthorize("hasAnyRole('CASHIER','OWNER')")
    @Transactional
    public ReceiptDto confirmOnlinePayment(UUID orderId, ConfirmPaymentRequest request, UUID confirmerId) {
        OnlineOrder order = getOrderOrThrow(orderId);

        if (order.getStatus() != OnlineOrderStatus.SCREENSHOT_SUBMITTED) {
            throw new AppException(HttpStatus.CONFLICT,
                    "Order is not in SCREENSHOT_SUBMITTED status");
        }

        if (receiptRepository.existsByOnlineOrderId(orderId)) {
            throw new AppException(HttpStatus.CONFLICT, "Order is already paid");
        }

        // Validate stock
        for (var item : order.getItems()) {
            Product product = item.getProduct();
            if (product.getStockQuantity() < item.getQuantity()) {
                throw new AppException(HttpStatus.CONFLICT,
                        "Insufficient stock for product: " + product.getName()
                                + ". Available: " + product.getStockQuantity()
                                + ", Requested: " + item.getQuantity());
            }
        }

        // Deduct stock
        for (var item : order.getItems()) {
            deductStockWithRetry(item.getProduct(), item.getQuantity());
        }

        order.setStatus(OnlineOrderStatus.PAID);
        onlineOrderRepository.save(order);

        ExchangeRateSetting rate = exchangeRateService.getActiveRate();
        BigDecimal amount = "KES".equalsIgnoreCase(request.getPaymentCurrency())
                ? order.getTotalAmount()
                : order.getTotalAmount().divide(rate.getRate(), 2, RoundingMode.HALF_UP);

        User confirmer = getUserOrThrow(confirmerId);
        Receipt receipt = Receipt.builder()
                .receiptNumber(paymentService.generateReceiptNumber(LocalDate.now()))
                .onlineOrder(order)
                .confirmedBy(confirmer)
                .totalAmount(order.getTotalAmount())
                .amount(amount)
                .paymentCurrency(request.getPaymentCurrency())
                .paymentMethod(request.getPaymentMethod())
                .exchangeRateUsed(rate.getRate())
                .status(ReceiptStatus.PAID)
                .build();
        receiptRepository.save(receipt);

        return paymentService.toDto(receipt);
    }

    // ── Cashier/Owner: reject online payment ─────────────────────────────

    @PreAuthorize("hasAnyRole('CASHIER','OWNER')")
    @Transactional
    public void rejectOnlinePayment(UUID orderId, String reason) {
        OnlineOrder order = getOrderOrThrow(orderId);

        if (order.getStatus() != OnlineOrderStatus.SCREENSHOT_SUBMITTED) {
            throw new AppException(HttpStatus.CONFLICT,
                    "Order is not in SCREENSHOT_SUBMITTED status");
        }

        order.setStatus(OnlineOrderStatus.PAYMENT_REJECTED);
        order.setRejectionReason(reason);
        onlineOrderRepository.save(order);
    }

    // ── Status progression ────────────────────────────────────────────────

    @PreAuthorize("hasAnyRole('OWNER','CASHIER')")
    @Transactional
    public OnlineOrderDto progressStatus(UUID orderId, OnlineOrderStatus targetStatus) {
        OnlineOrder order = getOrderOrThrow(orderId);
        validateTransition(order.getStatus(), targetStatus);
        order.setStatus(targetStatus);
        onlineOrderRepository.save(order);
        return toDto(order, null);
    }

    // ── Helpers ───────────────────────────────────────────────────────────

    private void validateTransition(OnlineOrderStatus current, OnlineOrderStatus target) {
        boolean valid = switch (current) {
            case PENDING_PAYMENT -> target == OnlineOrderStatus.SCREENSHOT_SUBMITTED
                    || target == OnlineOrderStatus.CANCELLED;
            case SCREENSHOT_SUBMITTED -> target == OnlineOrderStatus.PAID
                    || target == OnlineOrderStatus.PAYMENT_REJECTED
                    || target == OnlineOrderStatus.CANCELLED;
            case PAYMENT_REJECTED -> target == OnlineOrderStatus.SCREENSHOT_SUBMITTED
                    || target == OnlineOrderStatus.CANCELLED;
            case PAID -> target == OnlineOrderStatus.PROCESSING
                    || target == OnlineOrderStatus.CANCELLED;
            case PROCESSING -> target == OnlineOrderStatus.READY
                    || target == OnlineOrderStatus.CANCELLED;
            case READY -> target == OnlineOrderStatus.DELIVERED
                    || target == OnlineOrderStatus.CANCELLED;
            case DELIVERED, CANCELLED -> false;  // terminal states
        };
        if (!valid) {
            throw new AppException(HttpStatus.CONFLICT,
                    "Invalid status transition: " + current + " → " + target);
        }
    }

    private void validateScreenshot(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new AppException(HttpStatus.BAD_REQUEST,
                    "Invalid file. Please upload a JPG or PNG image under 5MB.");
        }
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_TYPES.contains(contentType.toLowerCase())) {
            throw new AppException(HttpStatus.BAD_REQUEST,
                    "Invalid file. Please upload a JPG or PNG image under 5MB.");
        }
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new AppException(HttpStatus.BAD_REQUEST,
                    "Invalid file. Please upload a JPG or PNG image under 5MB.");
        }
    }

    private String getExtension(String contentType) {
        return "image/png".equalsIgnoreCase(contentType) ? ".png" : ".jpg";
    }

    private void ensureCustomerOwns(OnlineOrder order, UUID customerId) {
        if (!order.getCustomer().getId().equals(customerId)) {
            throw new AppException(HttpStatus.FORBIDDEN, "Access denied");
        }
    }

    private void deductStockWithRetry(Product product, int quantity) {
        int attempts = 0;
        while (true) {
            try {
                product.setStockQuantity(product.getStockQuantity() - quantity);
                productRepository.save(product);
                return;
            } catch (ObjectOptimisticLockingFailureException e) {
                if (attempts >= 1) {
                    throw new AppException(HttpStatus.CONFLICT,
                            "Concurrent modification detected. Please try again.");
                }
                attempts++;
                product = productRepository.findById(product.getId())
                        .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Product not found"));
            }
        }
    }

    private String buildPaymentInstructions() {
        String bank = shopSettingRepository.findBySettingKey("payment_bank_account")
                .map(ShopSetting::getSettingValue).orElse("");
        String mobile = shopSettingRepository.findBySettingKey("payment_mobile_money")
                .map(ShopSetting::getSettingValue).orElse("");
        return "Bank Account: " + bank + " | Mobile Money: " + mobile;
    }

    private OnlineOrder getOrderOrThrow(UUID orderId) {
        return onlineOrderRepository.findById(orderId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Order not found"));
    }

    private User getUserOrThrow(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "User not found"));
    }

    private Product getActiveProductOrThrow(UUID productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Product not found: " + productId));
        if (!product.isActive()) {
            throw new AppException(HttpStatus.NOT_FOUND, "Product not found: " + productId);
        }
        return product;
    }

    public OnlineOrderDto toDto(OnlineOrder order, String paymentInstructions) {
        List<OnlineOrderItemDto> items = order.getItems().stream()
                .map(i -> OnlineOrderItemDto.builder()
                        .id(i.getId())
                        .productId(i.getProduct().getId())
                        .productName(i.getProduct().getName())
                        .quantity(i.getQuantity())
                        .unitPrice(i.getUnitPrice())
                        .build())
                .collect(Collectors.toList());

        return OnlineOrderDto.builder()
                .id(order.getId())
                .customerId(order.getCustomer().getId())
                .customerName(order.getCustomer().getFullName())
                .status(order.getStatus())
                .totalAmount(order.getTotalAmount())
                .deliveryAddress(order.getDeliveryAddress())
                .paymentScreenshotUrl(order.getPaymentScreenshotUrl())
                .paymentReference(order.getPaymentReference())
                .rejectionReason(order.getRejectionReason())
                .paymentInstructions(paymentInstructions)
                .createdAt(order.getCreatedAt())
                .items(items)
                .build();
    }
}
