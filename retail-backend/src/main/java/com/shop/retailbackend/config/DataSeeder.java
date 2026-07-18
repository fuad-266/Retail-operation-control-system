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
    private final com.shop.retailbackend.repository.UserRepository userRepository;
    private final org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    // Default settings to seed if not already present
    private static final Map<String, String> DEFAULTS = Map.of(
            "receipt_show_item_prices", "true",
            "payment_bank_account", "",
            "payment_mobile_money", "");

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

        java.util.Optional<com.shop.retailbackend.entity.User> existingAdmin = userRepository.findByEmail("admin@shop.com");
        if (existingAdmin.isEmpty()) {
            com.shop.retailbackend.entity.User admin = com.shop.retailbackend.entity.User.builder()
                    .fullName("Admin User")
                    .phoneNumber("1234567890")
                    .email("admin@shop.com")
                    .password(passwordEncoder.encode("password123"))
                    .role(com.shop.retailbackend.entity.Role.OWNER)
                    .isActive(true)
                    .preferredCurrency("KSH")
                    .build();
            userRepository.save(admin);
            log.info("Seeded default admin user: admin@shop.com / password123");
        } else {
            com.shop.retailbackend.entity.User admin = existingAdmin.get();
            admin.setPassword(passwordEncoder.encode("password123"));
            admin.setPreferredCurrency("KSH");
            userRepository.save(admin);
            log.info("Updated existing admin user password to match password123");
        }
    }
}
