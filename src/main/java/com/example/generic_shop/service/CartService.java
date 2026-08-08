package com.example.generic_shop.service;

import com.example.generic_shop.entity.Cart;

public interface CartService {
    Cart getCart(String email);
    Cart addToCart(String email, Long productId, int quantity);
    Cart updateCart(String email, Long productId, int quantity);
    void removeItem(Long itemId);
    void clearCart(String email);
}
