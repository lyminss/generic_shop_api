package com.example.generic_shop.dto;

import lombok.Data;

@Data
public class RegisterRequest {
    private String email;
    private String password;
    private String firstName;
    private String lastName;
    private String name; // Fallback if submitted as full name
    private String phone;
}
