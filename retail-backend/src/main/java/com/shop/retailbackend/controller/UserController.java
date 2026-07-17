package com.shop.retailbackend.controller;

import com.shop.retailbackend.dto.user.CreateUserRequest;
import com.shop.retailbackend.dto.user.UserDto;
import com.shop.retailbackend.service.UserService;
import jakarta.validation.Valid;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping
    public ResponseEntity<List<UserDto>> listUsers() {
        return ResponseEntity.ok(userService.listAllUsers());
    }

    @PostMapping
    public ResponseEntity<UserDto> createUser(@Valid @RequestBody CreateUserRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(userService.createUser(request));
    }

    @PutMapping("/{id}/deactivate")
    public ResponseEntity<Void> deactivateUser(@PathVariable UUID id, Authentication auth) {
        UUID requesterId = (UUID) auth.getPrincipal();
        userService.deactivateUser(id, requesterId);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/me/currency-preference")
    public ResponseEntity<Void> updateCurrencyPreference(@RequestBody CurrencyPreferenceRequest request,
                                                          Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();
        userService.updateCurrencyPreference(userId, request.getCurrency());
        return ResponseEntity.noContent().build();
    }

    @Data
    static class CurrencyPreferenceRequest {
        private String currency;
    }
}
