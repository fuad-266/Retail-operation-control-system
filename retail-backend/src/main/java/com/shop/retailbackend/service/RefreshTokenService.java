package com.shop.retailbackend.service;

import com.shop.retailbackend.entity.RefreshToken;
import com.shop.retailbackend.entity.User;
import com.shop.retailbackend.exception.AppException;
import com.shop.retailbackend.repository.RefreshTokenRepository;
import com.shop.retailbackend.repository.UserRepository;
import com.shop.retailbackend.security.JwtProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RefreshTokenService {

    private final RefreshTokenRepository refreshTokenRepository;
    private final UserRepository userRepository;
    private final JwtProperties jwtProperties;

    @Transactional
    public RefreshToken createRefreshToken(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "User not found"));

        RefreshToken refreshToken = RefreshToken.builder()
                .user(user)
                .token(UUID.randomUUID().toString())
                .expiryDate(Instant.now().plusMillis(jwtProperties.getRefreshExpirationMs()))
                .build();

        return refreshTokenRepository.save(refreshToken);
    }

    public RefreshToken verifyExpiration(RefreshToken token) {
        if (token.getExpiryDate().compareTo(Instant.now()) < 0) {
            refreshTokenRepository.delete(token);
            throw new AppException(HttpStatus.FORBIDDEN, "Refresh token was expired. Please make a new signin request");
        }
        return token;
    }

    public Optional<RefreshToken> findByToken(String token) {
        return refreshTokenRepository.findByToken(token);
    }

    @Transactional
    public void deleteByUserId(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "User not found"));
        refreshTokenRepository.deleteByUser(user);
    }
}
