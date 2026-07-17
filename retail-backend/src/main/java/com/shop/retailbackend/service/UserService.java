package com.shop.retailbackend.service;

import com.shop.retailbackend.dto.user.CreateUserRequest;
import com.shop.retailbackend.dto.user.UserDto;
import com.shop.retailbackend.entity.Role;
import com.shop.retailbackend.entity.User;
import com.shop.retailbackend.exception.AppException;
import com.shop.retailbackend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    // ── OWNER creates any role ────────────────────────────────────────────

    @PreAuthorize("hasRole('OWNER')")
    @Transactional
    public UserDto createUser(CreateUserRequest request) {
        ensurePhoneUnique(request.getPhoneNumber());
        User user = buildUser(request, request.getRole());
        userRepository.save(user);
        return toDto(user);
    }

    // ── OWNER or SELLER creates customer (role always forced to CUSTOMER) ─

    @PreAuthorize("hasAnyRole('OWNER','SELLER')")
    @Transactional
    public UserDto createCustomer(CreateUserRequest request) {
        ensurePhoneUnique(request.getPhoneNumber());
        User user = buildUser(request, Role.CUSTOMER);
        userRepository.save(user);
        return toDto(user);
    }

    // ── OWNER lists all users ─────────────────────────────────────────────

    @PreAuthorize("hasRole('OWNER')")
    public List<UserDto> listAllUsers() {
        return userRepository.findAll().stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    // ── OWNER deactivates a user ─────────────────────────────────────────

    @PreAuthorize("hasRole('OWNER')")
    @Transactional
    public void deactivateUser(UUID targetId, UUID requesterId) {
        if (targetId.equals(requesterId)) {
            throw new AppException(HttpStatus.CONFLICT, "You cannot deactivate your own account");
        }
        User user = getUserOrThrow(targetId);
        user.setActive(false);
        userRepository.save(user);
    }

    // ── Any authenticated user updates currency preference ────────────────

    @Transactional
    public void updateCurrencyPreference(UUID userId, String currency) {
        if (!currency.equals("KES") && !currency.equals("ETB")) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Currency must be KES or ETB");
        }
        User user = getUserOrThrow(userId);
        user.setPreferredCurrency(currency);
        userRepository.save(user);
    }

    // ── Helpers ───────────────────────────────────────────────────────────

    private void ensurePhoneUnique(String phone) {
        if (userRepository.existsByPhoneNumber(phone)) {
            throw new AppException(HttpStatus.CONFLICT,
                    "A user with this phone number already exists");
        }
    }

    private User buildUser(CreateUserRequest request, Role role) {
        return User.builder()
                .fullName(request.getFullName())
                .phoneNumber(request.getPhoneNumber())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(role)
                .isActive(true)
                .preferredCurrency("ETB")
                .build();
    }

    private User getUserOrThrow(UUID id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "User not found"));
    }

    public UserDto toDto(User user) {
        return UserDto.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .phoneNumber(user.getPhoneNumber())
                .email(user.getEmail())
                .role(user.getRole())
                .isActive(user.isActive())
                .preferredCurrency(user.getPreferredCurrency())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
