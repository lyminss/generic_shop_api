package com.example.generic_shop.repository;

import com.example.generic_shop.entity.Cart;
import com.example.generic_shop.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CartRepository extends JpaRepository<Cart, Long> {

    Optional<Cart> findByCustomer(User user);
}
