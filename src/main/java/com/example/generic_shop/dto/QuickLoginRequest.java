package com.example.generic_shop.dto;

import lombok.Data;

@Data
public class QuickLoginRequest {
    private String role; // ADMIN, STAFF, BARISTA, USER
    private String email;
}
