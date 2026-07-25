package com.shop.retailbackend.service;

import com.shop.retailbackend.dto.order.*;
import com.shop.retailbackend.entity.*;
import com.shop.retailbackend.exception.AppException;
import com.shop.retailbackend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SaleOrderService {

    private final SaleOrderRepository saleOrderRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final ExchangeRateService exchangeRateService;

    // ── Create PENDING order (no stock deduction) ─────────────────────────

    @PreAuthorize("hasAnyRole('SELLER','OWNER','CASHIER')")
    @Transactional
    public SaleOrderDto createOrder(CreateOrderRequest request, UUID sellerId) {
        User seller = getUserOrThrow(sellerId);
        SaleOrder order = buildOrder(request.getItems(), seller, SaleOrderStatus.PENDING, request.getCustomerName(),
                null);
        saleOrderRepository.save(order);
        return toDto(order);
    }

    // ── Create RESERVED order (deduct stock immediately) ──────────────────

    @PreAuthorize("hasAnyRole('SELLER','OWNER','CASHIER')")
    @Transactional
    public SaleOrderDto createReservedOrder(CreateReservedOrderRequest request, UUID sellerId) {
        User seller = getUserOrThrow(sellerId);

        // Validate all stock before touching anything
        for (var item : request.getItems()) {
            Product product = getActiveProductOrThrow(item.getProductId());
            if (product.getStockQuantity() < item.getQuantity()) {
                throw new AppException(HttpStatus.CONFLICT,
                        "Insufficient stock for product: " + product.getName()
                                + ". Available: " + product.getStockQuantity()
                                + ", Requested: " + item.getQuantity());
            }
        }

        // Deduct stock
        for (var item : request.getItems()) {
            Product product = getActiveProductOrThrow(item.getProductId());
            product.setStockQuantity(product.getStockQuantity() - item.getQuantity());
            productRepository.save(product);
        }

        SaleOrder order = buildOrder(request.getItems(), seller, SaleOrderStatus.RESERVED,
                request.getReservedForName(), request.getReservedForPhone());
        order.setReservationExpiresAt(LocalDateTime.now().plusHours(6));
        saleOrderRepository.save(order);
        return toDto(order);
    }

    // ── Cancel order ──────────────────────────────────────────────────────

    @PreAuthorize("hasAnyRole('SELLER','OWNER','CASHIER')")
    @Transactional
    public void cancelOrder(UUID orderId, UUID sellerId) {
        SaleOrder order = getOrderOrThrow(orderId);

        // SELLER can only cancel their own orders
        if (!order.getSeller().getId().equals(sellerId)) {
            throw new AppException(HttpStatus.FORBIDDEN, "Access denied");
        }

        if (order.getStatus() == SaleOrderStatus.PAID) {
            throw new AppException(HttpStatus.CONFLICT, "Cannot cancel a paid order");
        }
        if (order.getStatus() == SaleOrderStatus.CANCELLED) {
            throw new AppException(HttpStatus.CONFLICT, "Order is already cancelled");
        }

        // Restore stock if it was RESERVED
        if (order.getStatus() == SaleOrderStatus.RESERVED) {
            for (SaleOrderItem item : order.getItems()) {
                Product product = item.getProduct();
                product.setStockQuantity(product.getStockQuantity() + item.getQuantity());
                productRepository.save(product);
            }
        }

        order.setStatus(SaleOrderStatus.CANCELLED);
        saleOrderRepository.save(order);
    }

    // ── Convert RESERVED → PENDING ────────────────────────────────────────

    @PreAuthorize("hasAnyRole('SELLER','CASHIER')")
    @Transactional
    public SaleOrderDto convertToPending(UUID orderId) {
        SaleOrder order = getOrderOrThrow(orderId);
        if (order.getStatus() != SaleOrderStatus.RESERVED) {
            throw new AppException(HttpStatus.CONFLICT,
                    "Order is no longer in RESERVED/PENDING status");
        }
        order.setStatus(SaleOrderStatus.PENDING);
        order.setReservationExpiresAt(null);
        saleOrderRepository.save(order);
        return toDto(order);
    }

    // ── List endpoints ────────────────────────────────────────────────────

    @PreAuthorize("hasAnyRole('SELLER','OWNER','CASHIER')")
    @Transactional(readOnly = true)
    public List<SaleOrderDto> listMyOrders(UUID sellerId) {
        return saleOrderRepository.findAllBySellerId(sellerId).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @PreAuthorize("hasAnyRole('OWNER','CASHIER')")
    @Transactional(readOnly = true)
    public List<SaleOrderDto> listPendingOrders() {
        return saleOrderRepository.findAllByStatus(SaleOrderStatus.PENDING).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @PreAuthorize("hasAnyRole('OWNER','CASHIER')")
    @Transactional(readOnly = true)
    public List<SaleOrderDto> listReservedOrders() {
        return saleOrderRepository.findAllByStatus(SaleOrderStatus.RESERVED).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    // ── Helpers ───────────────────────────────────────────────────────────

    private SaleOrder buildOrder(List<OrderItemRequest> items, User seller,
            SaleOrderStatus status,
            String reservedForName, String reservedForPhone) {
        SaleOrder order = SaleOrder.builder()
                .seller(seller)
                .status(status)
                .reservedForName(reservedForName)
                .reservedForPhone(reservedForPhone)
                .totalAmount(BigDecimal.ZERO)
                .build();

        BigDecimal total = BigDecimal.ZERO;
        for (OrderItemRequest itemReq : items) {
            Product product = getActiveProductOrThrow(itemReq.getProductId());
            BigDecimal unitPrice = product.getPrice();
            total = total.add(unitPrice.multiply(BigDecimal.valueOf(itemReq.getQuantity())));

            SaleOrderItem item = SaleOrderItem.builder()
                    .order(order)
                    .product(product)
                    .quantity(itemReq.getQuantity())
                    .unitPrice(unitPrice)
                    .build();
            order.getItems().add(item);
        }
        order.setTotalAmount(total);
        return order;
    }

    public SaleOrder getOrderOrThrow(UUID orderId) {
        return saleOrderRepository.findById(orderId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Order not found"));
    }

    private User getUserOrThrow(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "User not found"));
    }

    private Product getActiveProductOrThrow(UUID productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND,
                        "Product not found: " + productId));
        if (!product.isActive()) {
            throw new AppException(HttpStatus.NOT_FOUND, "Product not found: " + productId);
        }
        return product;
    }

    public SaleOrderDto toDto(SaleOrder order) {
        List<SaleOrderItemDto> itemDtos = order.getItems().stream()
                .map(i -> SaleOrderItemDto.builder()
                        .id(i.getId())
                        .productId(i.getProduct().getId())
                        .productName(i.getProduct().getName())
                        .quantity(i.getQuantity())
                        .unitPriceKes(i.getUnitPrice())
                        .unitPriceEtb(exchangeRateService.convertKesToEtb(i.getUnitPrice()))
                        .subtotalKes(i.getUnitPrice().multiply(BigDecimal.valueOf(i.getQuantity())))
                        .subtotalEtb(exchangeRateService
                                .convertKesToEtb(i.getUnitPrice().multiply(BigDecimal.valueOf(i.getQuantity()))))
                        .build())
                .collect(Collectors.toList());

        return SaleOrderDto.builder()
                .id(order.getId())
                .sellerId(order.getSeller().getId())
                .sellerName(order.getSeller().getFullName())
                .status(order.getStatus())
                .totalAmountKes(order.getTotalAmount())
                .totalAmountEtb(exchangeRateService.convertKesToEtb(order.getTotalAmount()))
                .reservedForName(order.getReservedForName())
                .reservedForPhone(order.getReservedForPhone())
                .reservationExpiresAt(order.getReservationExpiresAt())
                .cancellationReason(order.getCancellationReason())
                .createdAt(order.getCreatedAt())
                .items(itemDtos)
                .build();
    }
}
