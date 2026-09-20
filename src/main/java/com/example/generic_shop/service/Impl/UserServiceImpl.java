package com.example.generic_shop.service.Impl;


import com.example.generic_shop.dto.ChangePasswordRequest;
import com.example.generic_shop.dto.GoogleLoginRequest;
import com.example.generic_shop.dto.LoginRequest;
import com.example.generic_shop.dto.QuickLoginRequest;
import com.example.generic_shop.dto.RegisterRequest;
import com.example.generic_shop.entity.User;
import com.example.generic_shop.repository.UserRepository;
import com.example.generic_shop.security.JwtUtil;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Base64;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

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
    public ResponseEntity<?> register(RegisterRequest request) {
        if (request.getEmail() == null || request.getEmail().trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Email is required");
        }
        if (request.getPassword() == null || request.getPassword().length() < 6) {
            return ResponseEntity.badRequest().body("Password must be at least 6 characters");
        }

        String email = request.getEmail().trim().toLowerCase();
        if (userRepository.findByEmail(email).isPresent()) {
            return ResponseEntity.status(400).body("Email already exists");
        }

        User user = new User();
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setPhone(request.getPhone());
        
        String firstName = request.getFirstName();
        String lastName = request.getLastName();
        if ((firstName == null || firstName.trim().isEmpty()) && request.getName() != null) {
            String full = request.getName().trim();
            int idx = full.lastIndexOf(' ');
            if (idx > 0) {
                lastName = full.substring(0, idx).trim();
                firstName = full.substring(idx + 1).trim();
            } else {
                firstName = full;
                lastName = "";
            }
        }
        user.setFirstName(firstName);
        user.setLastName(lastName);
        user.setRole("USER");

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
    public ResponseEntity<?> googleLogin(GoogleLoginRequest request) {
        String email = null;
        String name = request.getName();
        String givenName = request.getGivenName();
        String familyName = request.getFamilyName();

        // Decode JWT token payload if credential is provided
        if (request.getCredential() != null && !request.getCredential().trim().isEmpty()) {
            try {
                String[] parts = request.getCredential().split("\\.");
                if (parts.length >= 2) {
                    byte[] decoded = Base64.getUrlDecoder().decode(parts[1]);
                    ObjectMapper mapper = new ObjectMapper();
                    JsonNode node = mapper.readTree(decoded);
                    if (node.has("email")) email = node.get("email").asText();
                    if (node.has("name") && name == null) name = node.get("name").asText();
                    if (node.has("given_name") && givenName == null) givenName = node.get("given_name").asText();
                    if (node.has("family_name") && familyName == null) familyName = node.get("family_name").asText();
                }
            } catch (Exception e) {
                // If decoding fails, continue to check fallback email
            }
        }

        if (email == null || email.trim().isEmpty()) {
            email = request.getEmail();
        }

        if (email == null || email.trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Invalid Google credentials: email not found");
        }

        email = email.trim().toLowerCase();
        Optional<User> existingUserOpt = userRepository.findByEmail(email);

        User user;
        if (existingUserOpt.isPresent()) {
            user = existingUserOpt.get();
            boolean changed = false;
            if ((user.getFirstName() == null || user.getFirstName().isEmpty()) && givenName != null) {
                user.setFirstName(givenName);
                changed = true;
            }
            if ((user.getLastName() == null || user.getLastName().isEmpty()) && familyName != null) {
                user.setLastName(familyName);
                changed = true;
            }
            if (changed) {
                userRepository.save(user);
            }
        } else {
            user = new User();
            user.setEmail(email);
            user.setPassword(passwordEncoder.encode(UUID.randomUUID().toString()));
            user.setFirstName(givenName != null ? givenName : (name != null ? name : "Google"));
            user.setLastName(familyName != null ? familyName : "User");
            user.setRole("USER");
            userRepository.save(user);
        }

        String token = jwtUtil.generateToken(user.getEmail());
        return ResponseEntity.ok(Map.of(
                "token", token,
                "role", user.getRole(),
                "email", user.getEmail()
        ));
    }

    @Override
    public ResponseEntity<?> quickLogin(QuickLoginRequest request) {
        String role = request.getRole() != null ? request.getRole().toUpperCase().trim() : "";
        String email = request.getEmail() != null ? request.getEmail().toLowerCase().trim() : null;

        if (email == null || email.isEmpty()) {
            switch (role) {
                case "ADMIN":
                    email = "admin@tuctactea.com";
                    break;
                case "STAFF":
                    email = "staff@tuctactea.com";
                    break;
                case "BARISTA":
                    email = "barista@tuctactea.com";
                    break;
                case "USER":
                default:
                    email = "user@tuctactea.com";
                    role = "USER";
                    break;
            }
        }

        Optional<User> userOpt = userRepository.findByEmail(email);
        User user;
        if (userOpt.isPresent()) {
            user = userOpt.get();
            if (!role.isEmpty() && (request.getEmail() == null || request.getEmail().isEmpty())) {
                if (!role.equalsIgnoreCase(user.getRole())) {
                    user.setRole(role);
                    userRepository.save(user);
                }
            }
        } else {
            // Seed if missing
            user = new User();
            user.setEmail(email);
            user.setRole(role.isEmpty() ? "USER" : role);
            switch (user.getRole()) {
                case "ADMIN":
                    user.setPassword(passwordEncoder.encode("admin123"));
                    user.setFirstName("Quản Trị");
                    user.setLastName("Admin");
                    user.setPhone("0909123456");
                    break;
                case "STAFF":
                    user.setPassword(passwordEncoder.encode("staff123"));
                    user.setFirstName("Thu Ngân");
                    user.setLastName("Staff");
                    user.setPhone("0909888999");
                    break;
                case "BARISTA":
                    user.setPassword(passwordEncoder.encode("barista123"));
                    user.setFirstName("Pha Chế");
                    user.setLastName("Barista");
                    user.setPhone("0909777666");
                    break;
                default:
                    user.setPassword(passwordEncoder.encode("user123"));
                    user.setFirstName("Khách Hàng");
                    user.setLastName("Thân Thiết");
                    user.setPhone("0909654321");
                    break;
            }
            userRepository.save(user);
        }

        String token = jwtUtil.generateToken(user.getEmail());
        return ResponseEntity.ok(Map.of(
                "token", token,
                "role", user.getRole(),
                "email", user.getEmail()
        ));
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

    @Override
    public ResponseEntity<?> updateProfile(com.example.generic_shop.dto.UpdateProfileRequest request) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (request.getFirstName() != null) user.setFirstName(request.getFirstName());
        if (request.getLastName() != null) user.setLastName(request.getLastName());
        if (request.getPhone() != null) user.setPhone(request.getPhone());

        userRepository.save(user);
        user.setPassword(null);
        return ResponseEntity.ok(user);
    }
}
