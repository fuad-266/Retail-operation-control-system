package com.shop.retailbackend.service;

import com.shop.retailbackend.dto.auth.AuthResponse;
import com.shop.retailbackend.dto.auth.LoginRequest;
import com.shop.retailbackend.dto.auth.TokenRefreshRequest;
import com.shop.retailbackend.dto.auth.TokenRefreshResponse;
import com.shop.retailbackend.entity.RefreshToken;
import com.shop.retailbackend.entity.User;
import com.shop.retailbackend.exception.AppException;
import com.shop.retailbackend.repository.UserRepository;
import com.shop.retailbackend.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final RefreshTokenService refreshTokenService;

    public AuthResponse login(LoginRequest request) {
        // Require at least one identifier
        if ((request.getPhoneNumber() == null || request.getPhoneNumber().isBlank())
                && (request.getEmail() == null || request.getEmail().isBlank())) {
            throw new AppException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
        }

        // Look up by phone first, then email
        User user = null;
        if (request.getPhoneNumber() != null && !request.getPhoneNumber().isBlank()) {
            user = userRepository.findByPhoneNumber(request.getPhoneNumber()).orElse(null);
        }
        if (user == null && request.getEmail() != null && !request.getEmail().isBlank()) {
            user = userRepository.findByEmail(request.getEmail()).orElse(null);
        }

        // Generic message — do not reveal which field failed
        if (user == null || !passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new AppException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
        }

        if (!user.isActive()) {
            throw new AppException(HttpStatus.FORBIDDEN, "Account is deactivated");
        }

        String token = jwtUtil.generateToken(user.getId(), user.getRole().name());
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(user.getId());

        return AuthResponse.builder()
                .token(token)
                .refreshToken(refreshToken.getToken())
                .role(user.getRole().name())
                .userId(user.getId())
                .build();
    }

    public TokenRefreshResponse refreshToken(TokenRefreshRequest request) {
        String requestRefreshToken = request.getRefreshToken();

        return refreshTokenService.findByToken(requestRefreshToken)
                .map(refreshTokenService::verifyExpiration)
                .map(RefreshToken::getUser)
                .map(user -> {
                    String token = jwtUtil.generateToken(user.getId(), user.getRole().name());
                    return new TokenRefreshResponse(token, requestRefreshToken, "Bearer");
                })
                .orElseThrow(() -> new AppException(HttpStatus.FORBIDDEN, "Refresh token is not in database!"));
    }
}
