package com.example.generic_shop.repository;

import com.example.generic_shop.entity.Cart;
import com.example.generic_shop.entity.CartItem;
import com.example.generic_shop.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CartItemRepository extends JpaRepository<CartItem, Long> {

    Optional<CartItem> findByCartAndProduct(Cart cart, Product product);
    //dinh nghia them 1 ham tim bang id
}
