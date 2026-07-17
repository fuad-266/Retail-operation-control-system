package com.shop.retailbackend.controller;

import com.shop.retailbackend.dto.auth.AuthResponse;
import com.shop.retailbackend.dto.auth.LoginRequest;
import com.shop.retailbackend.dto.auth.TokenRefreshRequest;
import com.shop.retailbackend.dto.auth.TokenRefreshResponse;
import com.shop.retailbackend.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/refresh")
    public ResponseEntity<TokenRefreshResponse> refresh(@Valid @RequestBody TokenRefreshRequest request) {
        return ResponseEntity.ok(authService.refreshToken(request));
    }

    // Explicitly return 404 for any call to /register (requirement 1.1)
    @RequestMapping("/register")
    public ResponseEntity<Void> register() {
        return ResponseEntity.notFound().build();
    }
}
