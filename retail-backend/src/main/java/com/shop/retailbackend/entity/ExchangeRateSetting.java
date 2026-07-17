package com.shop.retailbackend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "exchange_rate_settings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExchangeRateSetting {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "rate", nullable = false, precision = 19, scale = 6)
    private BigDecimal rate;    // divisor: ETB = KES ÷ rate

    @Column(name = "label")
    private String label;       // e.g. "1 KES = 1.82 ETB"

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "set_by_id")
    private User setBy;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
