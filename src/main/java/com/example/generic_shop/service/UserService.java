package com.example.generic_shop.service;

import com.example.generic_shop.dto.ChangePasswordRequest;
import com.example.generic_shop.dto.LoginRequest;
import com.example.generic_shop.dto.UpdateProfileRequest;
import com.example.generic_shop.entity.User;
import org.springframework.http.ResponseEntity;

public interface UserService {
    ResponseEntity<?> register(User user);
    ResponseEntity<?> login(LoginRequest request);
    ResponseEntity<?> changePassword(ChangePasswordRequest request);
    ResponseEntity<?> getUserProfile();
    ResponseEntity<?> updateProfile(UpdateProfileRequest request);
}
