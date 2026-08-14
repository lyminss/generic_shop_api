package com.example.generic_shop.service.Impl;

import com.example.generic_shop.entity.Order;
import com.example.generic_shop.entity.User;
import com.example.generic_shop.enums.OrderStatus;
import com.example.generic_shop.repository.OrderRepository;
import com.example.generic_shop.repository.ProductRepository;
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
    private final ProductRepository productRepository;
    private final CartService cartService;

    @org.springframework.transaction.annotation.Transactional
    @Override
    public ResponseEntity<?> checkout(java.util.Map<String, String> request) {
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

        // Kiểm tra tồn kho trước khi tạo đơn
        for (com.example.generic_shop.entity.CartItem cartItem : cart.getItems()) {
            if (cartItem.getProduct().getStockQuantity() < cartItem.getQuantity()) {
                return ResponseEntity.badRequest().body(
                        "Product '" + cartItem.getProduct().getName() + "' does not have enough stock. Available: "
                                + cartItem.getProduct().getStockQuantity() + ", Requested: " + cartItem.getQuantity());
            }
        }

        double totalPrice = 0;
        java.util.List<com.example.generic_shop.entity.OrderItem> orderItems = new java.util.ArrayList<>();
        for (com.example.generic_shop.entity.CartItem cartItem : cart.getItems()) {
            com.example.generic_shop.entity.OrderItem orderItem = new com.example.generic_shop.entity.OrderItem();
            orderItem.setOrder(order);
            orderItem.setProduct(cartItem.getProduct());
            orderItem.setQuantity(cartItem.getQuantity());
            orderItem.setPrice(cartItem.getProduct().getPrice());
            totalPrice += cartItem.getQuantity() * cartItem.getProduct().getPrice();
            orderItems.add(orderItem);
        }
        order.setItems(orderItems);
        order.setTotalPrice(totalPrice);

        orderRepository.save(order);

        // Trừ tồn kho sau khi tạo đơn thành công
        for (com.example.generic_shop.entity.OrderItem orderItem : orderItems) {
            com.example.generic_shop.entity.Product product = orderItem.getProduct();
            product.setStockQuantity(product.getStockQuantity() - orderItem.getQuantity());
            productRepository.save(product);
        }

        cartService.clearCart(email);

        return ResponseEntity.ok(toDTO(order));
    }

    @Override
    public ResponseEntity<?> getOrderById(Long id) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));

        Order order = orderRepository.findById(id).orElseThrow(() -> new RuntimeException("Order not found"));

        if (!order.getCustomer().getId().equals(user.getId()) && !user.getRole().equals("ADMIN")) {
            return ResponseEntity.status(403).body("Access denied");
        }

        return ResponseEntity.ok(toDTO(order));
    }

    @Override
    public ResponseEntity<?> getMyOrders() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<Order> orders = orderRepository.findByCustomerOrderByCreatedAtDesc(user);

        return ResponseEntity.ok(orders.stream().map(this::toDTO).toList());
    }

    @Override
    public ResponseEntity<?> getAllOrders() {
        List<Order> orders = orderRepository.findAll();
        return ResponseEntity.ok(orders.stream().map(this::toDTO).toList());
    }

    @Override
    public ResponseEntity<?> updateOrderStatus(Long id, OrderStatus status) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        if (order.getOrderStatus() == OrderStatus.COMPLETED ||
                order.getOrderStatus() == OrderStatus.CANCEL) {
            return ResponseEntity.badRequest().body("Cannot update completed/cancelled order");
        }

        // Hoàn trả tồn kho khi hủy đơn
        if (status == OrderStatus.CANCEL) {
            for (com.example.generic_shop.entity.OrderItem item : order.getItems()) {
                com.example.generic_shop.entity.Product product = item.getProduct();
                product.setStockQuantity(product.getStockQuantity() + item.getQuantity());
                productRepository.save(product);
            }
        }

        order.setOrderStatus(status);
        orderRepository.save(order);

        return ResponseEntity.ok("Order status updated successfully");
    }

    // ============ Mapper helper ============

    private com.example.generic_shop.dto.OrderDTO toDTO(Order order) {
        com.example.generic_shop.dto.OrderDTO dto = new com.example.generic_shop.dto.OrderDTO();
        dto.setId(order.getId());
        dto.setOrderStatus(order.getOrderStatus());
        dto.setTotalPrice(order.getTotalPrice());
        dto.setShippingAddress(order.getShippingAddress());
        dto.setCreatedAt(order.getCreatedAt());
        dto.setUpdatedAt(order.getUpdatedAt());

        if (order.getItems() != null) {
            dto.setItems(order.getItems().stream().map(item -> {
                com.example.generic_shop.dto.OrderItemDTO itemDTO = new com.example.generic_shop.dto.OrderItemDTO();
                itemDTO.setId(item.getId());
                itemDTO.setQuantity(item.getQuantity());
                itemDTO.setPrice(item.getPrice());
                itemDTO.setSubtotal(item.getPrice() * item.getQuantity());
                if (item.getProduct() != null) {
                    itemDTO.setProductId(item.getProduct().getId());
                    itemDTO.setProductName(item.getProduct().getName());
                    itemDTO.setProductImage(item.getProduct().getImage());
                }
                return itemDTO;
            }).toList());
        }

        return dto;
    }
}
