package com.shop.retailbackend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "receipts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Receipt {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "receipt_number", unique = true, nullable = false)
    private String receiptNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sale_order_id")
    private SaleOrder order;        // nullable — either this or onlineOrder is set

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "online_order_id")
    private OnlineOrder onlineOrder;  // nullable

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "confirmed_by_id", nullable = false)
    private User confirmedBy;

    @Column(name = "total_amount", nullable = false, precision = 19, scale = 2)
    private BigDecimal totalAmount;   // always in KES

    @Column(name = "amount", nullable = false, precision = 19, scale = 2)
    private BigDecimal amount;        // in payment_currency

    @Column(name = "payment_currency", nullable = false)
    private String paymentCurrency;   // 'KES' or 'ETB'

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_method", nullable = false)
    private PaymentMethod paymentMethod;

    @Column(name = "exchange_rate_used", nullable = false, precision = 19, scale = 6)
    private BigDecimal exchangeRateUsed;  // audit only — never returned in DTO

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private ReceiptStatus status;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
