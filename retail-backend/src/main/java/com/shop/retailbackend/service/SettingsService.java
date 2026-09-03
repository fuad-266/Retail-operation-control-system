package com.shop.retailbackend.service;

import com.shop.retailbackend.dto.settings.ExchangeRateDto;
import com.shop.retailbackend.dto.settings.ExchangeRateRequest;
import com.shop.retailbackend.entity.ExchangeRateSetting;
import com.shop.retailbackend.entity.ShopSetting;
import com.shop.retailbackend.entity.User;
import com.shop.retailbackend.exception.AppException;
import com.shop.retailbackend.repository.ExchangeRateSettingRepository;
import com.shop.retailbackend.repository.ShopSettingRepository;
import com.shop.retailbackend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SettingsService {

    private final ExchangeRateSettingRepository exchangeRateRepository;
    private final ShopSettingRepository shopSettingRepository;
    private final UserRepository userRepository;
    private final ExchangeRateService exchangeRateService;

    // ── Exchange Rate ─────────────────────────────────────────────────────

    @PreAuthorize("hasRole('OWNER')")
    @Transactional
    public ExchangeRateDto setExchangeRate(ExchangeRateRequest request, UUID ownerId) {
        User owner = userRepository.findById(ownerId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "User not found"));

        BigDecimal etbPerKes = BigDecimal.ONE.divide(request.getRate(), 6, RoundingMode.HALF_UP);
        String label = "1 KES = " + etbPerKes.stripTrailingZeros().toPlainString() + " ETB";

        ExchangeRateSetting setting = ExchangeRateSetting.builder()
                .rate(request.getRate())
                .label(label)
                .setBy(owner)
                .build();
        exchangeRateRepository.save(setting);
        return toRateDto(setting, false);
    }

    public ExchangeRateDto getActiveExchangeRate() {
        ExchangeRateSetting rate = exchangeRateService.getActiveRate();
        boolean stale = exchangeRateService.isRateStale();
        return toRateDto(rate, stale);
    }

    @PreAuthorize("hasRole('OWNER')")
    public List<ExchangeRateDto> getExchangeRateHistory() {
        return exchangeRateRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(r -> toRateDto(r, false))
                .collect(Collectors.toList());
    }

    // ── Shop Settings ─────────────────────────────────────────────────────

    @PreAuthorize("hasRole('OWNER')")
    public Map<String, String> getAllSettings() {
        return shopSettingRepository.findAll().stream()
                .collect(Collectors.toMap(ShopSetting::getSettingKey, ShopSetting::getSettingValue));
    }

    @PreAuthorize("hasRole('OWNER')")
    @Transactional
    public void updateSettings(Map<String, String> updates, UUID ownerId) {
        User owner = userRepository.findById(ownerId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "User not found"));

        updates.forEach((key, value) -> {
            ShopSetting setting = shopSettingRepository.findBySettingKey(key)
                    .orElse(ShopSetting.builder().settingKey(key).build());
            setting.setSettingValue(value);
            setting.setUpdatedBy(owner);
            setting.setUpdatedAt(LocalDateTime.now());
            shopSettingRepository.save(setting);
        });
    }

    // ── Payment Info (public for authenticated users) ───────────────────

    public Map<String, String> getPaymentInfo() {
        Map<String, String> info = new java.util.HashMap<>();
        info.put("bankAccounts", shopSettingRepository.findBySettingKey("payment_bank_accounts")
                .map(ShopSetting::getSettingValue).orElse("[]"));
        info.put("mobileMoney", shopSettingRepository.findBySettingKey("payment_mobile_money")
                .map(ShopSetting::getSettingValue).orElse(""));
        return info;
    }

    // ── Helpers ───────────────────────────────────────────────────────────

    private ExchangeRateDto toRateDto(ExchangeRateSetting r, boolean stale) {
        return ExchangeRateDto.builder()
                .id(r.getId())
                .rate(r.getRate())
                .label(r.getLabel())
                .setById(r.getSetBy() != null ? r.getSetBy().getId() : null)
                .setByName(r.getSetBy() != null ? r.getSetBy().getFullName() : null)
                .createdAt(r.getCreatedAt())
                .staleRateWarning(stale)
                .build();
    }
}
