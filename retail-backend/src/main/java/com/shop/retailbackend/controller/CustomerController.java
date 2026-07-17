package com.shop.retailbackend.controller;

import com.shop.retailbackend.dto.user.CreateUserRequest;
import com.shop.retailbackend.dto.user.UserDto;
import com.shop.retailbackend.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/customers")
@RequiredArgsConstructor
public class CustomerController {

    private final UserService userService;

    @PostMapping
    public ResponseEntity<UserDto> createCustomer(@Valid @RequestBody CreateUserRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(userService.createCustomer(request));
    }
}
