package com.example.generic_shop.security;

import com.example.generic_shop.entity.User;
import com.example.generic_shop.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.*;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        String role = user.getRole();
        if (role == null || role.isEmpty()) {
            role = "USER";
        }
        
        // .roles() automatically adds "ROLE_" prefix, so remove it if present in DB
        if (role.startsWith("ROLE_")) {
            role = role.substring(5);
        }

        return org.springframework.security.core.userdetails.User
                .withUsername(user.getEmail())
                .password(user.getPassword())
                .roles(role)
                .build();
    }
}