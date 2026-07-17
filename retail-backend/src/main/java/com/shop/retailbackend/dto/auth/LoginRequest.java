package com.shop.retailbackend.dto.auth;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class LoginRequest {

    // Either phoneNumber or email must be provided — validated in service
    private String phoneNumber;
    private String email;

    @NotBlank(message = "Password is required")
    private String password;
}
