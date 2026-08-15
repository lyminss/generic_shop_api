package com.example.generic_shop.service.Impl;

import com.example.generic_shop.dto.OrderDTO;
import com.example.generic_shop.dto.OrderItemDTO;
import com.example.generic_shop.dto.PosOrderRequest;
import com.example.generic_shop.entity.*;
import com.example.generic_shop.enums.InventoryTransactionType;
import com.example.generic_shop.enums.ItemPreparedStatus;
import com.example.generic_shop.enums.OrderStatus;
import com.example.generic_shop.repository.*;
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
    private final RecipeItemRepository recipeItemRepository;
    private final IngredientRepository ingredientRepository;
    private final InventoryTransactionRepository inventoryTransactionRepository;
    private final OrderItemRepository orderItemRepository;

    @Transactional
    @Override
    public ResponseEntity<?> checkout(Map<String, String> request) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));

        Cart cart = cartService.getCart(email);
        if (cart.getItems() == null || cart.getItems().isEmpty()) {
            return ResponseEntity.badRequest().body("Cart is empty");
        }

        for (CartItem cartItem : cart.getItems()) {
            Product product = cartItem.getProduct();
            if (product.getStockQuantity() < cartItem.getQuantity()) {
                return ResponseEntity.badRequest().body(
                        "Món '" + product.getName() + "' không đủ tồn kho. Tồn: "
                                + product.getStockQuantity() + ", Yêu cầu: " + cartItem.getQuantity());
            }
            String err = checkIngredientStockForProduct(product, cartItem.getQuantity());
            if (err != null) return ResponseEntity.badRequest().body(err);
        }

        Order order = new Order();
        order.setCustomer(user);
        order.setOrderStatus(OrderStatus.NEW);
        order.setShippingAddress(request.get("shippingAddress"));

        double totalPrice = 0;
        List<OrderItem> orderItems = new ArrayList<>();
        for (CartItem cartItem : cart.getItems()) {
            OrderItem oi = new OrderItem();
            oi.setOrder(order);
            oi.setProduct(cartItem.getProduct());
            oi.setQuantity(cartItem.getQuantity());
            oi.setPrice(cartItem.getProduct().getPrice());
            oi.setPreparedStatus(ItemPreparedStatus.PENDING);
            totalPrice += cartItem.getQuantity() * cartItem.getProduct().getPrice();
            orderItems.add(oi);
        }
        order.setItems(orderItems);
        order.setTotalPrice(totalPrice);
        orderRepository.save(order);

        deductStockAndIngredients(order);
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

        for (PosOrderRequest.PosOrderItemDTO itemDto : request.getItems()) {
            Product product = productRepository.findById(itemDto.getProductId())
                    .orElseThrow(() -> new RuntimeException("Món không tồn tại ID: " + itemDto.getProductId()));
            if (product.getStockQuantity() < itemDto.getQuantity()) {
                return ResponseEntity.badRequest().body("Món '" + product.getName() + "' không đủ tồn kho.");
            }
            String err = checkIngredientStockForProduct(product, itemDto.getQuantity());
            if (err != null) return ResponseEntity.badRequest().body(err);
        }

        Order order = new Order();
        order.setCustomer(user);
        order.setOrderStatus(OrderStatus.NEW);
        String address = request.getShippingAddress();
        order.setShippingAddress((address == null || address.isBlank()) ? "Đơn tại quầy POS" : address);

        double totalPrice = 0;
        List<OrderItem> orderItems = new ArrayList<>();
        for (PosOrderRequest.PosOrderItemDTO itemDto : request.getItems()) {
            Product product = productRepository.findById(itemDto.getProductId()).get();
            OrderItem oi = new OrderItem();
            oi.setOrder(order);
            oi.setProduct(product);
            oi.setQuantity(itemDto.getQuantity());
            oi.setPrice(product.getPrice());
            oi.setPreparedStatus(ItemPreparedStatus.PENDING);
            totalPrice += itemDto.getQuantity() * product.getPrice();
            orderItems.add(oi);
        }
        order.setItems(orderItems);
        order.setTotalPrice(totalPrice);
        orderRepository.save(order);
        deductStockAndIngredients(order);

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
        User user = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));
        List<Order> orders = orderRepository.findByCustomerOrderByCreatedAtDesc(user);
        return ResponseEntity.ok(orders.stream().map(this::toDTO).toList());
    }

    @Override
    public ResponseEntity<?> getAllOrders() {
        return ResponseEntity.ok(orderRepository.findAll().stream().map(this::toDTO).toList());
    }

    @Transactional
    @Override
    public ResponseEntity<?> updateOrderStatus(Long id, OrderStatus status) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        if (order.getOrderStatus() == OrderStatus.COMPLETED || order.getOrderStatus() == OrderStatus.CANCEL) {
            return ResponseEntity.badRequest().body("Cannot update completed/cancelled order");
        }

        // Chặn COMPLETED nếu còn món chưa pha xong
        if (status == OrderStatus.COMPLETED) {
            boolean allReady = order.getItems().stream()
                    .allMatch(item -> item.getPreparedStatus() == ItemPreparedStatus.READY);
            if (!allReady) {
                long pendingCount = order.getItems().stream()
                        .filter(item -> item.getPreparedStatus() != ItemPreparedStatus.READY)
                        .count();
                return ResponseEntity.badRequest().body(
                        "Không thể hoàn thành đơn! Còn " + pendingCount + " món chưa được pha chế xong.");
            }
        }

        if (status == OrderStatus.CANCEL) {
            restoreStockAndIngredients(order);
        }

        order.setOrderStatus(status);
        orderRepository.save(order);
        return ResponseEntity.ok("Order status updated successfully");
    }

    /**
     * Barista đánh dấu 1 item đã pha xong (READY).
     * Nếu TẤT CẢ items = READY → tự động chuyển đơn sang SHIPPING.
     */
    @Transactional
    public ResponseEntity<?> markItemReady(Long itemId) {
        OrderItem item = orderItemRepository.findById(itemId)
                .orElseThrow(() -> new RuntimeException("OrderItem not found: " + itemId));

        item.setPreparedStatus(ItemPreparedStatus.READY);
        orderItemRepository.save(item);

        Order order = item.getOrder();
        boolean allReady = order.getItems().stream()
                .allMatch(i -> i.getPreparedStatus() == ItemPreparedStatus.READY);

        if (allReady
                && order.getOrderStatus() != OrderStatus.COMPLETED
                && order.getOrderStatus() != OrderStatus.CANCEL) {
            order.setOrderStatus(OrderStatus.SHIPPING);
            orderRepository.save(order);
            return ResponseEntity.ok(Map.of(
                    "message", "Tất cả món đã pha xong! Đơn #" + order.getId() + " → Chờ Giao/Trả Quầy.",
                    "allReady", true,
                    "order", toDTO(order)
            ));
        }

        return ResponseEntity.ok(Map.of(
                "message", "Đã đánh dấu món pha xong.",
                "allReady", false,
                "order", toDTO(order)
        ));
    }

    // -----------------------------------------------
    // Private helpers
    // -----------------------------------------------

    private String checkIngredientStockForProduct(Product product, int qty) {
        for (RecipeItem ri : recipeItemRepository.findByProductId(product.getId())) {
            double required = ri.getQuantity() * qty;
            Ingredient ing = ri.getIngredient();
            if (ing.getCurrentStock() < required) {
                return "Nguyên liệu '" + ing.getName() + "' không đủ để pha '" + product.getName()
                        + "'. Tồn: " + ing.getCurrentStock() + " " + ing.getUnit()
                        + ", Yêu cầu: " + required + " " + ing.getUnit();
            }
        }
        return null;
    }

    private void deductStockAndIngredients(Order order) {
        String ref = "ORD-" + order.getId();
        for (OrderItem item : order.getItems()) {
            Product p = item.getProduct();
            p.setStockQuantity(p.getStockQuantity() - item.getQuantity());
            productRepository.save(p);

            for (RecipeItem ri : recipeItemRepository.findByProductId(p.getId())) {
                Ingredient ing = ri.getIngredient();
                double consumed = ri.getQuantity() * item.getQuantity();
                double before = ing.getCurrentStock();
                double after = before - consumed;
                ing.setCurrentStock(after);
                ingredientRepository.save(ing);

                InventoryTransaction log = new InventoryTransaction();
                log.setIngredient(ing);
                log.setType(InventoryTransactionType.EXPORT_PREPARATION);
                log.setQuantity(-consumed);
                log.setStockBefore(before);
                log.setStockAfter(after);
                log.setReferenceCode(ref);
                log.setNote("Pha chế " + item.getQuantity() + "x " + p.getName());
                inventoryTransactionRepository.save(log);
            }
        }
    }

    private void restoreStockAndIngredients(Order order) {
        String ref = "ORD-" + order.getId();
        for (OrderItem item : order.getItems()) {
            Product p = item.getProduct();
            p.setStockQuantity(p.getStockQuantity() + item.getQuantity());
            productRepository.save(p);

            for (RecipeItem ri : recipeItemRepository.findByProductId(p.getId())) {
                Ingredient ing = ri.getIngredient();
                double refunded = ri.getQuantity() * item.getQuantity();
                double before = ing.getCurrentStock();
                double after = before + refunded;
                ing.setCurrentStock(after);
                ingredientRepository.save(ing);

                InventoryTransaction log = new InventoryTransaction();
                log.setIngredient(ing);
                log.setType(InventoryTransactionType.RETURN);
                log.setQuantity(refunded);
                log.setStockBefore(before);
                log.setStockAfter(after);
                log.setReferenceCode(ref);
                log.setNote("Hoàn kho hủy đơn #" + order.getId());
                inventoryTransactionRepository.save(log);
            }
        }
    }

    private OrderDTO toDTO(Order order) {
        OrderDTO dto = new OrderDTO();
        dto.setId(order.getId());
        dto.setTotalPrice(order.getTotalPrice());
        dto.setOrderStatus(order.getOrderStatus());
        dto.setShippingAddress(order.getShippingAddress());
        dto.setCreatedAt(order.getCreatedAt());

        if (order.getItems() != null) {
            dto.setItems(order.getItems().stream().map(item -> {
                OrderItemDTO d = new OrderItemDTO();
                d.setId(item.getId());
                d.setProductId(item.getProduct().getId());
                d.setProductName(item.getProduct().getName());
                d.setQuantity(item.getQuantity());
                d.setPrice(item.getPrice());
                d.setSubtotal(item.getQuantity() * item.getPrice());
                d.setPreparedStatus(item.getPreparedStatus());
                return d;
            }).toList());
        }
        return dto;
    }
}
