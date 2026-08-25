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

        // Không trừ kho ở đây — kho sẽ bị trừ khi Barista đánh dấu READY từng item
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
        // Không trừ kho ở đây — kho sẽ bị trừ khi Barista đánh dấu READY từng item

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
        return ResponseEntity.ok(orderRepository.findAllByOrderByCreatedAtDesc().stream().map(this::toDTO).toList());
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

        if (item.getPreparedStatus() == ItemPreparedStatus.READY) {
            return ResponseEntity.badRequest().body("Món này đã được đánh dấu hoàn thành rồi.");
        }

        // === Trừ kho nguyên liệu TẠI ĐÂY khi barista xác nhận pha xong ===
        deductStockForItem(item);

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
        java.time.LocalDate today = java.time.LocalDate.now();
        for (RecipeItem ri : recipeItemRepository.findByProductId(product.getId())) {
            Ingredient ing = ri.getIngredient();
            if (ing == null) continue;

            // Kiểm tra an toàn thực phẩm: Nguyên liệu tem nguyên đã quá hạn
            if (ing.getExpiryDate() != null && ing.getExpiryDate().isBefore(today)) {
                return "Nguyên liệu '" + ing.getName() + "' dùng cho món '" + product.getName()
                        + "' đã HẾT HẠN SỬ DỤNG (" + ing.getExpiryDate() + "). Không thể tạo đơn!";
            }

            // Kiểm tra nguyên liệu đã mở nắp quá hạn
            if (ing.getOpenedExpiryDate() != null && ing.getOpenedStock() != null && ing.getOpenedStock() > 0 && ing.getOpenedExpiryDate().isBefore(today)) {
                return "Nguyên liệu mở nắp '" + ing.getName() + "' dùng cho món '" + product.getName()
                        + "' đã QUÁ HẠN MỞ NẮP (" + ing.getOpenedExpiryDate() + "). Vui lòng kiểm tra và xử lý lô hàng!";
            }

            double requiredInIngUnit = com.example.generic_shop.util.UnitConverter.convertToIngredientUnit(
                    ri.getQuantity() * qty, ri.getUnit(), ing.getUnit());
            double currentStock = ing.getCurrentStock() != null ? ing.getCurrentStock() : 0.0;

            if (currentStock < requiredInIngUnit) {
                String reqDisplay = (ri.getUnit() != null && !ri.getUnit().equalsIgnoreCase(ing.getUnit()))
                        ? String.format("%.1f %s (%.3f %s)", ri.getQuantity() * qty, ri.getUnit(), requiredInIngUnit, ing.getUnit())
                        : String.format("%.3f %s", requiredInIngUnit, ing.getUnit());

                return "Nguyên liệu '" + ing.getName() + "' không đủ để pha " + qty + "x '" + product.getName()
                        + "'. Tồn: " + currentStock + " " + ing.getUnit()
                        + ", Yêu cầu: " + reqDisplay;
            }
        }
        return null;
    }

    /**
     * Trừ kho sản phẩm + nguyên liệu cho MỘT OrderItem khi Barista xác nhận pha xong.
     * Được gọi trong markItemReady — KHÔNG gọi khi tạo đơn.
     */
    private void deductStockForItem(OrderItem item) {
        String ref = "ORD-" + item.getOrder().getId();
        Product p = item.getProduct();
        p.setStockQuantity(Math.max(0, p.getStockQuantity() - item.getQuantity()));
        productRepository.save(p);

        for (RecipeItem ri : recipeItemRepository.findByProductId(p.getId())) {
            Ingredient ing = ri.getIngredient();
            if (ing == null) continue;

            double consumed = com.example.generic_shop.util.UnitConverter.convertToIngredientUnit(
                    ri.getQuantity() * item.getQuantity(), ri.getUnit(), ing.getUnit());

            double before = ing.getCurrentStock() != null ? ing.getCurrentStock() : 0.0;
            double after = Math.max(0.0, before - consumed);
            ing.setCurrentStock(after);

            // Trừ ưu tiên từ openedStock nếu có
            if (ing.getOpenedStock() != null && ing.getOpenedStock() > 0) {
                double opConsumed = Math.min(ing.getOpenedStock(), consumed);
                ing.setOpenedStock(Math.max(0.0, ing.getOpenedStock() - opConsumed));
            }

            ingredientRepository.save(ing);

            InventoryTransaction log = new InventoryTransaction();
            log.setIngredient(ing);
            log.setType(InventoryTransactionType.EXPORT_PREPARATION);
            log.setQuantity(-consumed);
            log.setStockBefore(before);
            log.setStockAfter(after);
            log.setReferenceCode(ref);
            log.setNote("Barista pha xong: " + item.getQuantity() + "x " + p.getName());
            inventoryTransactionRepository.save(log);
        }
    }

    /**
     * Hoàn kho khi hủy đơn — CHỈ hoàn những item đã READY (đã thực sự trừ kho).
     * Item còn PENDING chưa bị trừ kho nên không cần hoàn.
     */
    private void restoreStockAndIngredients(Order order) {
        String ref = "ORD-" + order.getId();
        for (OrderItem item : order.getItems()) {
            // Chỉ hoàn nếu món đó đã được barista xác nhận (đã trừ kho)
            if (item.getPreparedStatus() != ItemPreparedStatus.READY) continue;

            Product p = item.getProduct();
            p.setStockQuantity(p.getStockQuantity() + item.getQuantity());
            productRepository.save(p);

            for (RecipeItem ri : recipeItemRepository.findByProductId(p.getId())) {
                Ingredient ing = ri.getIngredient();
                if (ing == null) continue;

                double refunded = com.example.generic_shop.util.UnitConverter.convertToIngredientUnit(
                        ri.getQuantity() * item.getQuantity(), ri.getUnit(), ing.getUnit());

                double before = ing.getCurrentStock() != null ? ing.getCurrentStock() : 0.0;
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
                log.setNote("Hoàn kho hủy đơn #" + order.getId() + " (món đã pha)");
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
        dto.setUpdatedAt(order.getUpdatedAt());

        if (order.getItems() != null) {
            dto.setItems(order.getItems().stream().map(item -> {
                OrderItemDTO d = new OrderItemDTO();
                d.setId(item.getId());
                if (item.getProduct() != null) {
                    d.setProductId(item.getProduct().getId());
                    d.setProductName(item.getProduct().getName());
                    d.setProductImage(item.getProduct().getImage());
                }
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

