package com.example.generic_shop.config;

import com.example.generic_shop.entity.User;
import com.example.generic_shop.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        // Seed ADMIN
        seedAccount("admin@tuctactea.com", "admin123", "Quản Trị", "Admin", "0909123456", "ADMIN");

        // Seed USER
        seedAccount("user@tuctactea.com", "user123", "Khách Hàng", "Thân Thiết", "0909654321", "USER");

        // Seed STAFF
        seedAccount("staff@tuctactea.com", "staff123", "Thu Ngân", "Staff", "0909888999", "STAFF");

        // Seed BARISTA
        seedAccount("barista@tuctactea.com", "barista123", "Pha Chế", "Barista", "0909777666", "BARISTA");
    }

    private void seedAccount(String email, String rawPassword, String firstName, String lastName, String phone, String role) {
        if (userRepository.findByEmail(email).isEmpty()) {
            User user = new User();
            user.setEmail(email);
            user.setPassword(passwordEncoder.encode(rawPassword));
            user.setFirstName(firstName);
            user.setLastName(lastName);
            user.setPhone(phone);
            user.setRole(role);
            userRepository.save(user);
            System.out.println(">>> Seeded Account [" + role + "]: " + email + " / " + rawPassword);
        }
    }
}
