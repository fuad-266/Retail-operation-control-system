package com.shop.retailbackend.dto.user;

import com.shop.retailbackend.entity.Role;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class UserDto {

    private UUID id;
    private String fullName;
    private String phoneNumber;
    private String email;
    private Role role;
    private boolean isActive;
    private String preferredCurrency;
    private LocalDateTime createdAt;
}
