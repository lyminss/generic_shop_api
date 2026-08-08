package com.example.generic_shop.service.Impl;


import com.example.generic_shop.dto.ChangePasswordRequest;
import com.example.generic_shop.dto.LoginRequest;
import com.example.generic_shop.entity.User;
import com.example.generic_shop.repository.UserRepository;
import com.example.generic_shop.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.util.Map;
import java.util.Optional;


import com.example.generic_shop.service.UserService;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    @Override
    public ResponseEntity<?> register(User user){
        if (userRepository.findByEmail(user.getEmail()).isPresent()){
            return ResponseEntity.status(400).body("Email already exists");
        }

        user.setPassword(passwordEncoder.encode(user.getPassword()));
        
        if (user.getRole() == null || user.getRole().isEmpty()) {
            user.setRole("USER");
        }

        userRepository.save(user);

        return ResponseEntity.status(201).body("User registered successfully");

    }

    @Override
    public ResponseEntity<?> login(LoginRequest request){

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())){
            return ResponseEntity.status(401).body("Wrong password");
        }

        String token = jwtUtil.generateToken(user.getEmail());

        return ResponseEntity.ok(
                Map.of("token", token)
        );
    }

    @Override
    public ResponseEntity<?> changePassword(ChangePasswordRequest request){

        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        String email;

        if (principal instanceof UserDetails){
            email = ((UserDetails) principal).getUsername();
        } else {
            email = principal.toString();
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // validate input
        if (request.getOldPassword() == null || request.getNewPassword() == null) {
            return ResponseEntity.badRequest().body("Password must not be null");
        }

        if (request.getNewPassword().length() < 6) {
            return ResponseEntity.badRequest().body("New password must be at least 6 characters");
        }

        //check mật khẩu cũ
        if (!passwordEncoder.matches(request.getOldPassword(), user.getPassword())){
            return ResponseEntity.status(400).body("Old password is incorrect");
        }

        //không cho trùng password
        if (passwordEncoder.matches(request.getNewPassword(), user.getPassword())) {
            return ResponseEntity.status(400).body("New password must be different from old password");
        }

        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            return ResponseEntity.badRequest().body("Confirm password does not match");
        }

        //update password
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        return ResponseEntity.ok("Password changed successfully");
    }

    @Override
    public ResponseEntity<?> getUserProfile() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
                
        user.setPassword(null); // Do not return password to the client
        return ResponseEntity.ok(user);
    }
}
