package com.shop.retailbackend.service;

import com.shop.retailbackend.dto.payment.ConfirmPaymentRequest;
import com.shop.retailbackend.dto.payment.ReceiptDto;
import com.shop.retailbackend.dto.payment.ReceiptItemDto;
import com.shop.retailbackend.entity.*;
import com.shop.retailbackend.exception.AppException;
import com.shop.retailbackend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PaymentService {

    private final SaleOrderRepository saleOrderRepository;
    private final OnlineOrderRepository onlineOrderRepository;
    private final ReceiptRepository receiptRepository;
    private final ProductRepository productRepository;
    private final ShopSettingRepository shopSettingRepository;
    private final ExchangeRateService exchangeRateService;
    private final UserRepository userRepository;

    private static final int MAX_RETRIES = 1;

    // ── In-store payment confirmation ─────────────────────────────────────

    @PreAuthorize("hasAnyRole('OWNER','CASHIER')")
    @Transactional
    public ReceiptDto confirmPayment(UUID orderId, ConfirmPaymentRequest request, UUID confirmerId) {
        SaleOrder order = saleOrderRepository.findById(orderId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Order not found"));

        if (order.getStatus() == SaleOrderStatus.PAID) {
            throw new AppException(HttpStatus.CONFLICT, "Order is already paid");
        }
        if (order.getStatus() != SaleOrderStatus.PENDING) {
            throw new AppException(HttpStatus.CONFLICT,
                    "Order is no longer in RESERVED/PENDING status");
        }

        if (receiptRepository.existsByOrderId(orderId)) {
            throw new AppException(HttpStatus.CONFLICT, "Order is already paid");
        }

        // Validate stock
        for (SaleOrderItem item : order.getItems()) {
            Product product = item.getProduct();
            if (product.getStockQuantity() < item.getQuantity()) {
                throw new AppException(HttpStatus.CONFLICT,
                        "Insufficient stock for product: " + product.getName()
                                + ". Available: " + product.getStockQuantity()
                                + ", Requested: " + item.getQuantity());
            }
        }

        // Deduct stock (with optimistic lock retry)
        for (SaleOrderItem item : order.getItems()) {
            deductStockWithRetry(item.getProduct(), item.getQuantity());
        }

        order.setStatus(SaleOrderStatus.PAID);
        saleOrderRepository.save(order);

        ExchangeRateSetting rate = exchangeRateService.getActiveRate();
        BigDecimal amount = computeAmount(order.getTotalAmount(), request.getPaymentCurrency(), rate);

        Receipt receipt = Receipt.builder()
                .receiptNumber(generateReceiptNumber(LocalDate.now()))
                .order(order)
                .confirmedBy(getUserRef(confirmerId))
                .totalAmount(order.getTotalAmount())
                .amount(amount)
                .paymentCurrency(request.getPaymentCurrency())
                .paymentMethod(request.getPaymentMethod())
                .exchangeRateUsed(rate.getRate())
                .status(ReceiptStatus.PAID)
                .build();
        receiptRepository.save(receipt);

        return toDto(receipt);
    }

    // ── Receipt retrieval ─────────────────────────────────────────────────

    @PreAuthorize("hasAnyRole('GOODS_STAFF','OWNER','CASHIER')")
    @Transactional(readOnly = true)
    public ReceiptDto getReceipt(String receiptNumber) {
        Receipt receipt = receiptRepository.findByReceiptNumber(receiptNumber)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Receipt not found"));
        return toDto(receipt);
    }

    @PreAuthorize("hasAnyRole('OWNER','CASHIER')")
    @Transactional(readOnly = true)
    public List<ReceiptDto> getTodayReceipts() {
        return receiptRepository.findByCreatedAtDateOrderByCreatedAtDesc(LocalDate.now())
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    // ── Goods Staff: fulfill receipt ─────────────────────────────────────

    @PreAuthorize("hasRole('GOODS_STAFF')")
    @Transactional
    public ReceiptDto fulfillReceipt(String receiptNumber) {
        Receipt receipt = receiptRepository.findByReceiptNumber(receiptNumber)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Receipt not found"));

        if (receipt.getStatus() == ReceiptStatus.FULFILLED) {
            throw new AppException(HttpStatus.CONFLICT, "Receipt already fulfilled.");
        }

        receipt.setStatus(ReceiptStatus.FULFILLED);
        receiptRepository.save(receipt);
        return toDto(receipt);
    }

    // ── Helpers ───────────────────────────────────────────────────────────

    /**
     * Generates a receipt number in format RCP-YYYYMMDD-NNNN.
     * Uses a pessimistic DB lock (in ReceiptRepository) to prevent collisions.
     */
    String generateReceiptNumber(LocalDate date) {
        String dateStr = date.format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        long count = receiptRepository.countByCreatedAtDate(date);
        long sequence = count + 1;
        String paddedSeq = String.format("%04d", sequence);
        return "RCP-" + dateStr + "-" + paddedSeq;
    }

    private BigDecimal computeAmount(BigDecimal totalKes, String currency, ExchangeRateSetting rate) {
        if ("KES".equalsIgnoreCase(currency)) {
            return totalKes;
        }
        return totalKes.divide(rate.getRate(), 2, RoundingMode.HALF_UP);
    }

    private void deductStockWithRetry(Product product, int quantity) {
        int attempts = 0;
        while (true) {
            try {
                product.setStockQuantity(product.getStockQuantity() - quantity);
                productRepository.save(product);
                return;
            } catch (ObjectOptimisticLockingFailureException e) {
                if (attempts >= MAX_RETRIES) {
                    throw new AppException(HttpStatus.CONFLICT,
                            "Concurrent modification detected. Please try again.");
                }
                attempts++;
                // Reload fresh version
                product = productRepository.findById(product.getId())
                        .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Product not found"));
            }
        }
    }

    private User getUserRef(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Confirmer not found"));
    }

    boolean showItemPrices() {
        return shopSettingRepository.findBySettingKey("receipt_show_item_prices")
                .map(s -> "true".equalsIgnoreCase(s.getSettingValue()))
                .orElse(true);
    }

    public ReceiptDto toDto(Receipt receipt) {
        boolean showPrices = showItemPrices();

        List<ReceiptItemDto> items = List.of(); // default empty

        if (receipt.getOrder() != null) {
            items = receipt.getOrder().getItems().stream()
                    .map(i -> ReceiptItemDto.builder()
                            .productId(i.getProduct().getId())
                            .productName(i.getProduct().getName())
                            .quantity(i.getQuantity())
                            .unitPrice(showPrices ? i.getUnitPrice() : null)
                            .build())
                    .collect(Collectors.toList());
        } else if (receipt.getOnlineOrder() != null) {
            items = receipt.getOnlineOrder().getItems().stream()
                    .map(i -> ReceiptItemDto.builder()
                            .productId(i.getProduct().getId())
                            .productName(i.getProduct().getName())
                            .quantity(i.getQuantity())
                            .unitPrice(showPrices ? i.getUnitPrice() : null)
                            .build())
                    .collect(Collectors.toList());
        }

        return ReceiptDto.builder()
                .id(receipt.getId())
                .receiptNumber(receipt.getReceiptNumber())
                .orderId(receipt.getOrder() != null ? receipt.getOrder().getId() : null)
                .onlineOrderId(receipt.getOnlineOrder() != null ? receipt.getOnlineOrder().getId() : null)
                .confirmedById(receipt.getConfirmedBy().getId())
                .confirmedByName(receipt.getConfirmedBy().getFullName())
                .totalAmount(receipt.getTotalAmount())
                .amount(receipt.getAmount())
                .paymentCurrency(receipt.getPaymentCurrency())
                .paymentMethod(receipt.getPaymentMethod())
                .status(receipt.getStatus())
                .items(items)
                .createdAt(receipt.getCreatedAt())
                .build();
    }
}
