package com.example.generic_shop.service.Impl;


import com.example.generic_shop.entity.Cart;
import com.example.generic_shop.entity.CartItem;
import com.example.generic_shop.entity.Product;
import com.example.generic_shop.entity.User;
import com.example.generic_shop.repository.CartItemRepository;
import com.example.generic_shop.repository.CartRepository;
import com.example.generic_shop.repository.ProductRepository;
import com.example.generic_shop.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import com.example.generic_shop.service.CartService;

@Service
@RequiredArgsConstructor
public class CartServiceImpl implements CartService {

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    private User getCurrentUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }


    //get cart
    @Override
    public Cart getCart(String email){

        User user = getCurrentUser(email);
        return cartRepository.findByCustomer(user)
                .orElseGet(() -> {
                    Cart cart = new Cart();
                    cart.setCustomer(user);
                    return cartRepository.save(cart);
                });
    }

    //add to cart
    @Override
    public Cart addToCart(String email, Long productId, int quantity){

        User user = getCurrentUser(email);
        Cart cart = getCart(email);

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        CartItem item = cartItemRepository.findByCartAndProduct(cart, product).orElse(null);

        if (item == null){
            item = new CartItem();
            item.setCart(cart);
            item.setProduct(product);
            item.setQuantity(quantity);
        }else {
            item.setQuantity(item.getQuantity() + quantity);
        }

        cartItemRepository.save(item);
        return cart;
    }

    //update cart
    @Override
    public Cart updateCart(String email, Long productId, int quantity){

        Cart cart = getCart(email);
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        CartItem item = cartItemRepository.findByCartAndProduct(cart, product)
                .orElseThrow(() -> new RuntimeException("Cart item not found"));

        item.setQuantity(quantity);
        cartItemRepository.save(item);

        return cart;
    }

    //remove
    @Override
    public void removeItem(Long itemId){
        cartItemRepository.deleteById(itemId);
    }

    @org.springframework.transaction.annotation.Transactional
    @Override
    public void clearCart(String email) {
        Cart cart = getCart(email);
        cartItemRepository.deleteByCart(cart);
    }

}


