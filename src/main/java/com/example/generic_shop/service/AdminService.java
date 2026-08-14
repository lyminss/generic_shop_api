package com.example.generic_shop.service;

import org.springframework.http.ResponseEntity;

public interface AdminService {
    ResponseEntity<?> getStats();
    ResponseEntity<?> getAllUsers();
    ResponseEntity<?> updateUserRole(Long userId, String role);
}
