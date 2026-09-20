package com.example.generic_shop.controller;


import com.example.generic_shop.dto.ChangePasswordRequest;
import com.example.generic_shop.dto.GoogleLoginRequest;
import com.example.generic_shop.dto.LoginRequest;
import com.example.generic_shop.dto.QuickLoginRequest;
import com.example.generic_shop.dto.RegisterRequest;
import com.example.generic_shop.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.example.generic_shop.service.UserService;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request){
        return userService.register(request);
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request){
        return userService.login(request);
    }

    @PostMapping("/google")
    public ResponseEntity<?> googleLogin(@RequestBody GoogleLoginRequest request){
        return userService.googleLogin(request);
    }

    @PostMapping("/quick-login")
    public ResponseEntity<?> quickLogin(@RequestBody QuickLoginRequest request){
        return userService.quickLogin(request);
    }


    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(@RequestBody ChangePasswordRequest request){
        return userService.changePassword(request);
    }

    @GetMapping("/me")
    public ResponseEntity<?> getProfile() {
        return userService.getUserProfile();
    }

    @PutMapping("/me")
    public ResponseEntity<?> updateProfile(@RequestBody com.example.generic_shop.dto.UpdateProfileRequest user) {
        return userService.updateProfile(user);
    }
}
