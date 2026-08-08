package com.example.generic_shop.service.Impl;


import com.example.generic_shop.entity.Order;
import com.example.generic_shop.entity.User;
import com.example.generic_shop.enums.OrderStatus;
import com.example.generic_shop.repository.OrderRepository;
import com.example.generic_shop.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.List;

import com.example.generic_shop.service.OrderService;
import com.example.generic_shop.service.CartService;

@Service
@RequiredArgsConstructor
public class OrderServiceImpl implements OrderService {

    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final CartService cartService;

    @org.springframework.transaction.annotation.Transactional
    @Override
    public ResponseEntity<?> checkout(java.util.Map<String, String> request){
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));

        com.example.generic_shop.entity.Cart cart = cartService.getCart(email);
        if (cart.getItems() == null || cart.getItems().isEmpty()) {
            return ResponseEntity.badRequest().body("Cart is empty");
        }

        Order order = new Order();
        order.setCustomer(user);
        order.setOrderStatus(OrderStatus.NEW);
        order.setShippingAddress(request.get("shippingAddress"));

        double totalPrice = 0;
        java.util.List<com.example.generic_shop.entity.OrderItem> orderItems = new java.util.ArrayList<>();
        for (com.example.generic_shop.entity.CartItem cartItem : cart.getItems()) {
            com.example.generic_shop.entity.OrderItem orderItem = new com.example.generic_shop.entity.OrderItem();
            orderItem.setOrder(order);
            orderItem.setProduct(cartItem.getProduct());
            orderItem.setQuantity(cartItem.getQuantity());
            orderItem.setPrice(cartItem.getProduct().getPrice()); // Assuming Product has getPrice()
            totalPrice += cartItem.getQuantity() * cartItem.getProduct().getPrice();
            orderItems.add(orderItem);
        }
        order.setItems(orderItems);
        order.setTotalPrice(totalPrice);

        orderRepository.save(order);
        cartService.clearCart(email);

        return ResponseEntity.ok("Order created successfully");
    }

    @Override
    public ResponseEntity<?> getOrderById(Long id) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));
        
        Order order = orderRepository.findById(id).orElseThrow(() -> new RuntimeException("Order not found"));
        
        if (!order.getCustomer().getId().equals(user.getId()) && !user.getRole().equals("ADMIN")) {
            return ResponseEntity.status(403).body("Access denied");
        }
        
        return ResponseEntity.ok(order);
    }

    @Override
    public ResponseEntity<?> getMyOrders(){
        String email = SecurityContextHolder.getContext().getAuthentication().getName();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<Order> orders = orderRepository.findByCustomer(user);

        return ResponseEntity.ok(orders);
    }

    @Override
    public ResponseEntity<?> getAllOrders(){
        List<Order> orders = orderRepository.findAll();

        return ResponseEntity.ok(orders);
    }

    @Override
    public ResponseEntity<?> updateOrderStatus(Long id, OrderStatus status){
        Order order = orderRepository.findById(id)
                .orElseThrow(()->new RuntimeException("Order not found"));

        if (order.getOrderStatus() == OrderStatus.COMPLETED ||
            order.getOrderStatus() == OrderStatus.CANCEL){
            return ResponseEntity.badRequest().body("Cannot update completed/cancelled order");
        }

        order.setOrderStatus(status);
        orderRepository.save(order);

        return ResponseEntity.ok("Order status updated successfully");
    }
}
