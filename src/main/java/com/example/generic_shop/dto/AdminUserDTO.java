package com.example.generic_shop.dto;

import lombok.Data;

import java.util.Date;

@Data
public class AdminUserDTO {
    private Long id;
    private String email;
    private String firstName;
    private String lastName;
    private String phone;
    private String role;
    private Date createdAt;
}
