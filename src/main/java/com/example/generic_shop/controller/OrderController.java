package com.example.generic_shop.controller;


import com.example.generic_shop.entity.Order;
import com.example.generic_shop.enums.OrderStatus;
import com.example.generic_shop.service.Impl.OrderServiceImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.example.generic_shop.service.OrderService;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/orders")
public class OrderController {
    private final OrderService orderService;

    @PostMapping("/checkout")
    public ResponseEntity<?> checkout(@RequestBody java.util.Map<String, String> request){
        return orderService.checkout(request);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getOrderById(@PathVariable Long id){
        return orderService.getOrderById(id);
    }

    @GetMapping("/my")
    public ResponseEntity<?> myOrders(){
        return orderService.getMyOrders();
    }

    @GetMapping
    public ResponseEntity<?> allOrders(){
        return orderService.getAllOrders();
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateStatus(@PathVariable Long id, @RequestParam OrderStatus status){
        return orderService.updateOrderStatus(id, status);
    }
}
