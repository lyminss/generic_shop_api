package com.example.generic_shop.controller;

import com.example.generic_shop.entity.Cart;
import com.example.generic_shop.mapper.CartMapper;
import com.example.generic_shop.service.Impl.CartServiceImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import com.example.generic_shop.service.CartService;

@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
public class CartController {

    private final CartService cartService;

    private String getEmail(Authentication authentication) {
        return authentication.getName();
    }

    @GetMapping
    public ResponseEntity<?> getCart(Authentication auth) {
        Cart cart = cartService.getCart(getEmail(auth));
        return ResponseEntity.ok(CartMapper.toDTO(cart));
    }

    @PostMapping("/add")
    public ResponseEntity<?> addToCart(Authentication auth,
            @RequestParam Long productId,
            @RequestParam int quantity) {
        Cart cart = cartService.addToCart(getEmail(auth), productId, quantity);
        return ResponseEntity.ok(CartMapper.toDTO(cart));
    }

    @PutMapping("/update")
    public ResponseEntity<?> updateCart(Authentication auth,
            @RequestParam Long productId,
            @RequestParam int quantity) {
        Cart cart = cartService.updateCart(getEmail(auth), productId, quantity);
        return ResponseEntity.ok(CartMapper.toDTO(cart));
    }

    @DeleteMapping("/remove/{itemId}")
    public ResponseEntity<?> removeItem(Authentication auth, @PathVariable Long itemId) {
        cartService.removeItem(getEmail(auth), itemId);
        return ResponseEntity.noContent().build();
    }
}
