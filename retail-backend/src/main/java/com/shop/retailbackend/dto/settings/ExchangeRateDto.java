package com.shop.retailbackend.dto.settings;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class ExchangeRateDto {

    private UUID id;
    private BigDecimal rate;
    private String label;
    private UUID setById;
    private String setByName;
    private LocalDateTime createdAt;
    private boolean staleRateWarning;
}
