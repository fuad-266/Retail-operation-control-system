package com.shop.retailbackend.service;

import com.shop.retailbackend.entity.ExchangeRateSetting;
import com.shop.retailbackend.repository.ExchangeRateSettingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Service
@RequiredArgsConstructor
public class ExchangeRateService {

    private final ExchangeRateSettingRepository exchangeRateRepository;

    /**
     * Returns the most recent (active) exchange rate record.
     * Throws IllegalStateException if none has been configured yet.
     */
    public ExchangeRateSetting getActiveRate() {
        return exchangeRateRepository.findMostRecent()
                .orElse(ExchangeRateSetting.builder()
                        .rate(new BigDecimal("1.00"))
                        .label("1 KES = 1.00 ETB (Default)")
                        .build());
    }

    /**
     * Converts a KES amount to ETB using the active exchange rate.
     * Formula: ETB = KES ÷ rate
     */
    public BigDecimal convertKesToEtb(BigDecimal amountKes) {
        ExchangeRateSetting rate = getActiveRate();
        return amountKes.divide(rate.getRate(), 2, RoundingMode.HALF_UP);
    }

    /**
     * Converts based on the user's preferred currency.
     * Returns KES unchanged or converts to ETB.
     */
    public BigDecimal convertKesToDisplay(BigDecimal amountKes, String preferredCurrency) {
        if ("KES".equalsIgnoreCase(preferredCurrency)) {
            return amountKes;
        }
        return convertKesToEtb(amountKes);
    }

    /**
     * Returns true if the active rate was set more than 24 hours ago.
     */
    public boolean isRateStale() {
        return exchangeRateRepository.findMostRecent()
                .map(r -> r.getCreatedAt().isBefore(
                        java.time.LocalDateTime.now().minusHours(24)))
                .orElse(false);
    }
}
