package com.example.generic_shop.service.Impl;

import com.example.generic_shop.dto.AdminStatsDTO;
import com.example.generic_shop.dto.AdminUserDTO;
import com.example.generic_shop.dto.OrderDTO;
import com.example.generic_shop.dto.OrderItemDTO;
import com.example.generic_shop.entity.Order;
import com.example.generic_shop.entity.User;
import com.example.generic_shop.enums.OrderStatus;
import com.example.generic_shop.repository.OrderRepository;
import com.example.generic_shop.repository.ProductRepository;
import com.example.generic_shop.repository.UserRepository;
import com.example.generic_shop.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminServiceImpl implements AdminService {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    @Override
    public ResponseEntity<?> getStats() {
        List<Order> allOrders = orderRepository.findAll();
        long totalProducts = productRepository.count();
        long totalUsers = userRepository.count();

        double totalRevenue = allOrders.stream()
                .filter(o -> o.getOrderStatus() == OrderStatus.COMPLETED)
                .mapToDouble(o -> o.getTotalPrice() != null ? o.getTotalPrice() : 0.0)
                .sum();

        long newCount = allOrders.stream().filter(o -> o.getOrderStatus() == OrderStatus.NEW).count();
        long processingCount = allOrders.stream().filter(o -> o.getOrderStatus() == OrderStatus.PROCESSING).count();
        long shippingCount = allOrders.stream().filter(o -> o.getOrderStatus() == OrderStatus.SHIPPING).count();
        long completedCount = allOrders.stream().filter(o -> o.getOrderStatus() == OrderStatus.COMPLETED).count();
        long cancelledCount = allOrders.stream().filter(o -> o.getOrderStatus() == OrderStatus.CANCEL).count();

        List<OrderDTO> recent = allOrders.stream()
                .sorted((a, b) -> {
                    if (a.getCreatedAt() == null || b.getCreatedAt() == null) return 0;
                    return b.getCreatedAt().compareTo(a.getCreatedAt());
                })
                .limit(5)
                .map(this::toOrderDTO)
                .toList();

        AdminStatsDTO stats = new AdminStatsDTO();
        stats.setTotalRevenue(totalRevenue);
        stats.setTotalOrders(allOrders.size());
        stats.setTotalProducts(totalProducts);
        stats.setTotalUsers(totalUsers);
        stats.setNewOrdersCount(newCount);
        stats.setProcessingOrdersCount(processingCount);
        stats.setShippingOrdersCount(shippingCount);
        stats.setCompletedOrdersCount(completedCount);
        stats.setCancelledOrdersCount(cancelledCount);
        stats.setRecentOrders(recent);

        return ResponseEntity.ok(stats);
    }

    @Override
    public ResponseEntity<?> getAllUsers() {
        List<AdminUserDTO> users = userRepository.findAll().stream()
                .map(this::toUserDTO)
                .toList();
        return ResponseEntity.ok(users);
    }

    @Override
    public ResponseEntity<?> updateUserRole(Long userId, String role) {
        if (!"ADMIN".equalsIgnoreCase(role) && !"USER".equalsIgnoreCase(role)) {
            return ResponseEntity.badRequest().body("Role không hợp lệ. Chỉ chấp nhận ADMIN hoặc USER.");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Người dùng không tồn tại"));

        user.setRole(role.toUpperCase());
        userRepository.save(user);

        return ResponseEntity.ok(toUserDTO(user));
    }

    // =========== Mapper Helpers ===========

    private AdminUserDTO toUserDTO(User user) {
        AdminUserDTO dto = new AdminUserDTO();
        dto.setId(user.getId());
        dto.setEmail(user.getEmail());
        dto.setFirstName(user.getFirstName());
        dto.setLastName(user.getLastName());
        dto.setPhone(user.getPhone());
        dto.setRole(user.getRole());
        dto.setCreatedAt(user.getCreatedAt());
        return dto;
    }

    private OrderDTO toOrderDTO(Order order) {
        OrderDTO dto = new OrderDTO();
        dto.setId(order.getId());
        dto.setOrderStatus(order.getOrderStatus());
        dto.setTotalPrice(order.getTotalPrice());
        dto.setShippingAddress(order.getShippingAddress());
        dto.setCreatedAt(order.getCreatedAt());
        dto.setUpdatedAt(order.getUpdatedAt());

        if (order.getItems() != null) {
            dto.setItems(order.getItems().stream().map(item -> {
                OrderItemDTO itemDTO = new OrderItemDTO();
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
