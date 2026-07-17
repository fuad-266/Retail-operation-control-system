package com.shop.retailbackend.controller;

import com.shop.retailbackend.dto.settings.ExchangeRateDto;
import com.shop.retailbackend.dto.settings.ExchangeRateRequest;
import com.shop.retailbackend.service.SettingsService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/settings")
@RequiredArgsConstructor
public class SettingsController {

    private final SettingsService settingsService;

    @PostMapping("/exchange-rate")
    public ResponseEntity<ExchangeRateDto> setRate(@Valid @RequestBody ExchangeRateRequest request,
                                                    Authentication auth) {
        UUID ownerId = (UUID) auth.getPrincipal();
        return ResponseEntity.ok(settingsService.setExchangeRate(request, ownerId));
    }

    @GetMapping("/exchange-rate")
    public ResponseEntity<ExchangeRateDto> getRate() {
        return ResponseEntity.ok(settingsService.getActiveExchangeRate());
    }

    @GetMapping("/exchange-rate/history")
    public ResponseEntity<List<ExchangeRateDto>> getRateHistory() {
        return ResponseEntity.ok(settingsService.getExchangeRateHistory());
    }

    @GetMapping
    public ResponseEntity<Map<String, String>> getAllSettings() {
        return ResponseEntity.ok(settingsService.getAllSettings());
    }

    @PutMapping
    public ResponseEntity<Void> updateSettings(@RequestBody Map<String, String> updates,
                                                Authentication auth) {
        UUID ownerId = (UUID) auth.getPrincipal();
        settingsService.updateSettings(updates, ownerId);
        return ResponseEntity.noContent().build();
    }
}
