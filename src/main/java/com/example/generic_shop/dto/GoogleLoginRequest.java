package com.example.generic_shop.dto;

import lombok.Data;

@Data
public class GoogleLoginRequest {
    private String credential; // Google ID Token
    private String email;
    private String name;
    private String picture;
    private String givenName;
    private String familyName;
}
