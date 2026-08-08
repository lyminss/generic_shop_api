package com.example.generic_shop.controller;


import com.example.generic_shop.dto.ChangePasswordRequest;
import com.example.generic_shop.dto.LoginRequest;
import com.example.generic_shop.entity.User;
import com.example.generic_shop.service.Impl.UserServiceImpl;
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
    public ResponseEntity<?> register (@RequestBody User user){
        return userService.register(user);
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request){
        return userService.login(request);
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
