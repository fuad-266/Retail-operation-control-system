package com.shop.retailbackend.config;

import com.shop.retailbackend.entity.ShopSetting;
import com.shop.retailbackend.repository.ShopSettingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    private final ShopSettingRepository shopSettingRepository;

    // Default settings to seed if not already present
    private static final Map<String, String> DEFAULTS = Map.of(
            "receipt_show_item_prices", "true",
            "payment_bank_account", "",
            "payment_mobile_money", ""
    );

    @Override
    public void run(String... args) {
        DEFAULTS.forEach((key, value) -> {
            if (shopSettingRepository.findBySettingKey(key).isEmpty()) {
                shopSettingRepository.save(ShopSetting.builder()
                        .settingKey(key)
                        .settingValue(value)
                        .updatedAt(LocalDateTime.now())
                        .build());
                log.info("Seeded default shop setting: {} = {}", key, value);
            }
        });
    }
}
