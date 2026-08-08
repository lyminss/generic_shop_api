package com.example.generic_shop.service;

import com.example.generic_shop.enums.OrderStatus;
import org.springframework.http.ResponseEntity;
import java.util.Map;

public interface OrderService {
    ResponseEntity<?> checkout(Map<String, String> request);
    ResponseEntity<?> getOrderById(Long id);
    ResponseEntity<?> getMyOrders();
    ResponseEntity<?> getAllOrders();
    ResponseEntity<?> updateOrderStatus(Long id, OrderStatus status);
}
