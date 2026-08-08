package com.example.generic_shop.controller;


import com.example.generic_shop.entity.Order;
import com.example.generic_shop.enums.OrderStatus;
import com.example.generic_shop.service.Impl.OrderServiceImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/orders")
public class OrderController {
    private final OrderServiceImpl orderService;

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Order order){
        return orderService.createOrder(order);
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
