package com.example.generic_shop.service.Impl;

import com.example.generic_shop.dto.OrderDTO;
import com.example.generic_shop.dto.OrderItemDTO;
import com.example.generic_shop.dto.PosOrderRequest;
import com.example.generic_shop.entity.Ingredient;
import com.example.generic_shop.entity.InventoryTransaction;
import com.example.generic_shop.entity.Order;
import com.example.generic_shop.entity.OrderItem;
import com.example.generic_shop.entity.Product;
import com.example.generic_shop.entity.RecipeItem;
import com.example.generic_shop.entity.User;
import com.example.generic_shop.enums.InventoryTransactionType;
import com.example.generic_shop.enums.OrderStatus;
import com.example.generic_shop.repository.IngredientRepository;
import com.example.generic_shop.repository.InventoryTransactionRepository;
import com.example.generic_shop.repository.OrderRepository;
import com.example.generic_shop.repository.ProductRepository;
import com.example.generic_shop.repository.RecipeItemRepository;
import com.example.generic_shop.repository.UserRepository;
import com.example.generic_shop.service.CartService;
import com.example.generic_shop.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
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

    @Transactional
    @Override
    public ResponseEntity<?> checkout(Map<String, String> request) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));

        com.example.generic_shop.entity.Cart cart = cartService.getCart(email);
        if (cart.getItems() == null || cart.getItems().isEmpty()) {
            return ResponseEntity.badRequest().body("Cart is empty");
        }

        // 1. Kiểm tra tồn kho sản phẩm & tồn kho nguyên liệu trước
        for (com.example.generic_shop.entity.CartItem cartItem : cart.getItems()) {
            Product product = cartItem.getProduct();
            if (product.getStockQuantity() < cartItem.getQuantity()) {
                return ResponseEntity.badRequest().body(
                        "Món '" + product.getName() + "' không đủ tồn kho sản phẩm. Tồn: "
                                + product.getStockQuantity() + ", Yêu cầu: " + cartItem.getQuantity());
            }
            String recipeError = checkIngredientStockForProduct(product, cartItem.getQuantity());
            if (recipeError != null) {
                return ResponseEntity.badRequest().body(recipeError);
            }
        }

        Order order = new Order();
        order.setCustomer(user);
        order.setOrderStatus(OrderStatus.NEW);
        order.setShippingAddress(request.get("shippingAddress"));

        double totalPrice = 0;
        List<OrderItem> orderItems = new ArrayList<>();
        for (com.example.generic_shop.entity.CartItem cartItem : cart.getItems()) {
            OrderItem orderItem = new OrderItem();
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

        // 2. Trừ tồn kho sản phẩm & nguyên liệu pha chế
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

        // 1. Validation kiểm tra kho nguyên liệu & kho sản phẩm trước
        for (PosOrderRequest.PosOrderItemDTO itemDto : request.getItems()) {
            Product product = productRepository.findById(itemDto.getProductId())
                    .orElseThrow(() -> new RuntimeException("Món ăn không tồn tại ID: " + itemDto.getProductId()));

            if (product.getStockQuantity() < itemDto.getQuantity()) {
                return ResponseEntity.badRequest().body("Món '" + product.getName() + "' không đủ tồn kho sản phẩm. Tồn: "
                        + product.getStockQuantity() + ", Yêu cầu: " + itemDto.getQuantity());
            }

            String recipeError = checkIngredientStockForProduct(product, itemDto.getQuantity());
            if (recipeError != null) {
                return ResponseEntity.badRequest().body(recipeError);
            }
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
        List<OrderItem> orderItems = new ArrayList<>();

        for (PosOrderRequest.PosOrderItemDTO itemDto : request.getItems()) {
            Product product = productRepository.findById(itemDto.getProductId()).get();

            OrderItem orderItem = new OrderItem();
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

        // 2. Trừ tồn kho sản phẩm & nguyên liệu pha chế
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

    @Transactional
    @Override
    public ResponseEntity<?> updateOrderStatus(Long id, OrderStatus status) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        if (order.getOrderStatus() == OrderStatus.COMPLETED ||
                order.getOrderStatus() == OrderStatus.CANCEL) {
            return ResponseEntity.badRequest().body("Cannot update completed/cancelled order");
        }

        // Hoàn trả tồn kho sản phẩm & nguyên liệu khi hủy đơn
        if (status == OrderStatus.CANCEL) {
            restoreStockAndIngredients(order);
        }

        order.setOrderStatus(status);
        orderRepository.save(order);

        return ResponseEntity.ok("Order status updated successfully");
    }

    private String checkIngredientStockForProduct(Product product, int orderQuantity) {
        List<RecipeItem> recipeItems = recipeItemRepository.findByProductId(product.getId());
        for (RecipeItem recipeItem : recipeItems) {
            double required = recipeItem.getQuantity() * orderQuantity;
            Ingredient ingredient = recipeItem.getIngredient();
            if (ingredient.getCurrentStock() < required) {
                return "Nguyên liệu '" + ingredient.getName() + "' không đủ tồn kho để pha chế '" + product.getName()
                        + "'. Tồn: " + ingredient.getCurrentStock() + " " + ingredient.getUnit()
                        + ", Yêu cầu: " + required + " " + ingredient.getUnit();
            }
        }
        return null; // Đủ nguyên liệu
    }

    private void deductStockAndIngredients(Order order) {
        String refCode = "ORD-" + order.getId();

        for (OrderItem item : order.getItems()) {
            Product product = item.getProduct();
            // Trừ tồn kho sản phẩm
            product.setStockQuantity(product.getStockQuantity() - item.getQuantity());
            productRepository.save(product);

            // Trừ tồn kho nguyên liệu công thức
            List<RecipeItem> recipeItems = recipeItemRepository.findByProductId(product.getId());
            for (RecipeItem recipeItem : recipeItems) {
                Ingredient ingredient = recipeItem.getIngredient();
                double consumed = recipeItem.getQuantity() * item.getQuantity();

                double stockBefore = ingredient.getCurrentStock();
                double stockAfter = stockBefore - consumed;

                ingredient.setCurrentStock(stockAfter);
                ingredientRepository.save(ingredient);

                InventoryTransaction log = new InventoryTransaction();
                log.setIngredient(ingredient);
                log.setType(InventoryTransactionType.EXPORT_PREPARATION);
                log.setQuantity(-consumed);
                log.setStockBefore(stockBefore);
                log.setStockAfter(stockAfter);
                log.setReferenceCode(refCode);
                log.setNote("Trừ nguyên liệu pha chế cho " + item.getQuantity() + " " + product.getName());
                inventoryTransactionRepository.save(log);
            }
        }
    }

    private void restoreStockAndIngredients(Order order) {
        String refCode = "ORD-" + order.getId();

        for (OrderItem item : order.getItems()) {
            Product product = item.getProduct();
            // Hoàn tồn kho sản phẩm
            product.setStockQuantity(product.getStockQuantity() + item.getQuantity());
            productRepository.save(product);

            // Hoàn tồn kho nguyên liệu công thức
            List<RecipeItem> recipeItems = recipeItemRepository.findByProductId(product.getId());
            for (RecipeItem recipeItem : recipeItems) {
                Ingredient ingredient = recipeItem.getIngredient();
                double refunded = recipeItem.getQuantity() * item.getQuantity();

                double stockBefore = ingredient.getCurrentStock();
                double stockAfter = stockBefore + refunded;

                ingredient.setCurrentStock(stockAfter);
                ingredientRepository.save(ingredient);

                InventoryTransaction log = new InventoryTransaction();
                log.setIngredient(ingredient);
                log.setType(InventoryTransactionType.RETURN);
                log.setQuantity(refunded);
                log.setStockBefore(stockBefore);
                log.setStockAfter(stockAfter);
                log.setReferenceCode(refCode);
                log.setNote("Hoàn trả nguyên liệu do hủy đơn hàng #" + order.getId());
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
