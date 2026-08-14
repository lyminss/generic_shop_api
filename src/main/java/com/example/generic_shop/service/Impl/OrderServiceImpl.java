package com.example.generic_shop.service.Impl;

import com.example.generic_shop.dto.OrderDTO;
import com.example.generic_shop.dto.OrderItemDTO;
import com.example.generic_shop.dto.PosOrderRequest;
import com.example.generic_shop.entity.Order;
import com.example.generic_shop.entity.User;
import com.example.generic_shop.enums.OrderStatus;
import com.example.generic_shop.repository.OrderRepository;
import com.example.generic_shop.repository.ProductRepository;
import com.example.generic_shop.repository.UserRepository;
import com.example.generic_shop.service.CartService;
import com.example.generic_shop.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class OrderServiceImpl implements OrderService {

    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final CartService cartService;

    @Transactional
    @Override
    public ResponseEntity<?> checkout(Map<String, String> request) {
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
        List<com.example.generic_shop.entity.OrderItem> orderItems = new ArrayList<>();
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

    @Transactional
    @Override
    public ResponseEntity<?> createPosOrder(PosOrderRequest request) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));

        if (request.getItems() == null || request.getItems().isEmpty()) {
            return ResponseEntity.badRequest().body("Danh sách món ăn không được để trống");
        }

        Order order = new Order();
        order.setCustomer(user);
        order.setOrderStatus(OrderStatus.NEW);

        String address = request.getShippingAddress();
        if (address == null || address.isBlank()) {
            address = "Đơn tại quầy POS";
        }
        order.setShippingAddress(address);

        double totalPrice = 0;
        List<com.example.generic_shop.entity.OrderItem> orderItems = new ArrayList<>();

        for (PosOrderRequest.PosOrderItemDTO itemDto : request.getItems()) {
            com.example.generic_shop.entity.Product product = productRepository.findById(itemDto.getProductId())
                    .orElseThrow(() -> new RuntimeException("Món ăn không tồn tại ID: " + itemDto.getProductId()));

            if (product.getStockQuantity() < itemDto.getQuantity()) {
                return ResponseEntity.badRequest().body("Món '" + product.getName() + "' không đủ tồn kho. Tồn: "
                        + product.getStockQuantity() + ", Yêu cầu: " + itemDto.getQuantity());
            }

            com.example.generic_shop.entity.OrderItem orderItem = new com.example.generic_shop.entity.OrderItem();
            orderItem.setOrder(order);
            orderItem.setProduct(product);
            orderItem.setQuantity(itemDto.getQuantity());
            orderItem.setPrice(product.getPrice());

            totalPrice += itemDto.getQuantity() * product.getPrice();
            orderItems.add(orderItem);
        }

        order.setItems(orderItems);
        order.setTotalPrice(totalPrice);

        orderRepository.save(order);

        // Deduct stock
        for (com.example.generic_shop.entity.OrderItem orderItem : orderItems) {
            com.example.generic_shop.entity.Product product = orderItem.getProduct();
            product.setStockQuantity(product.getStockQuantity() - orderItem.getQuantity());
            productRepository.save(product);
        }

        return ResponseEntity.ok(toDTO(order));
    }

    @Override
    public ResponseEntity<?> getOrderById(Long id) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));

        Order order = orderRepository.findById(id).orElseThrow(() -> new RuntimeException("Order not found"));

        if (!order.getCustomer().getId().equals(user.getId())
                && !user.getRole().equals("ADMIN")
                && !user.getRole().equals("STAFF")
                && !user.getRole().equals("BARISTA")) {
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

    private OrderDTO toDTO(Order order) {
        OrderDTO dto = new OrderDTO();
        dto.setId(order.getId());
        dto.setTotalPrice(order.getTotalPrice());
        dto.setOrderStatus(order.getOrderStatus());
        dto.setShippingAddress(order.getShippingAddress());
        dto.setCreatedAt(order.getCreatedAt());

        if (order.getItems() != null) {
            List<OrderItemDTO> itemDTOs = order.getItems().stream().map(item -> {
                OrderItemDTO itemDTO = new OrderItemDTO();
                itemDTO.setId(item.getId());
                itemDTO.setProductId(item.getProduct().getId());
                itemDTO.setProductName(item.getProduct().getName());
                itemDTO.setQuantity(item.getQuantity());
                itemDTO.setPrice(item.getPrice());
                itemDTO.setSubtotal(item.getQuantity() * item.getPrice());
                return itemDTO;
            }).toList();
            dto.setItems(itemDTOs);
        }

        return dto;
    }
}
