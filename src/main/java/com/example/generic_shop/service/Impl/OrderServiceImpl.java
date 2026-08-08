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

@Service
@RequiredArgsConstructor
public class OrderServiceImpl {

    private final OrderRepository orderRepository;
    private final UserRepository userRepository;

    public ResponseEntity<?> createOrder(Order order){
        String email = SecurityContextHolder.getContext().getAuthentication().getName();

        User user = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));

        order.setCustomer(user);
        order.setOrderStatus(OrderStatus.NEW);

        if (order.getItems() != null){
            order.getItems().forEach(item -> item.setOrder(order));
        }

        orderRepository.save(order);

        return ResponseEntity.ok("Order created successfully");
    }

    public ResponseEntity<?> getMyOrders(){
        String email = SecurityContextHolder.getContext().getAuthentication().getName();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<Order> orders = orderRepository.findByCustomer(user);

        return ResponseEntity.ok(orders);
    }

    public ResponseEntity<?> getAllOrders(){
        List<Order> orders = orderRepository.findAll();

        return ResponseEntity.ok(orders);
    }

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
