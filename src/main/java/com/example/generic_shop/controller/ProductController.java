package com.example.generic_shop.controller;

import com.example.generic_shop.entity.Product;
import com.example.generic_shop.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/product")
@RequiredArgsConstructor
public class ProductController {
    private final ProductService productService;

    @GetMapping
    public ResponseEntity<List<Product>> getAllProduct(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String search) {
        if ((category != null && !category.isBlank()) || (search != null && !search.isBlank())) {
            return ResponseEntity.ok(productService.getFiltered(category, search));
        }
        return ResponseEntity.ok(productService.getAll());
    }

    @GetMapping("/categories")
    public ResponseEntity<List<String>> getCategories() {
        return ResponseEntity.ok(productService.getCategories());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getProductById(@PathVariable Long id){
        try {
            return ResponseEntity.ok(productService.getById(id));
        } catch (RuntimeException e){
            return ResponseEntity.status(404).body(e.getMessage());
        }
    }

    @PostMapping
    public ResponseEntity<Product> createProduct(@RequestBody Product product){
        return ResponseEntity.status(201).body(productService.createProduct(product));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateProduct(@PathVariable Long id, @RequestBody Product product){
        try {
            return ResponseEntity.ok(productService.updateProduct(id, product));
        } catch (RuntimeException e){
            return ResponseEntity.status(404).body(e.getMessage());
        }
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<?> updateProductStatus(@PathVariable Long id, @RequestBody Map<String, String> body){
        try {
            String status = body.getOrDefault("status", "ACTIVE");
            return ResponseEntity.ok(productService.updateProductStatus(id, status));
        } catch (RuntimeException e){
            return ResponseEntity.status(404).body(e.getMessage());
        }
    }

    /**
     * Smart delete:
     * - Chưa có đơn → Hard delete
     * - Đã có đơn → Soft delete vào Thùng rác
     * Response: { "type": "HARD"|"SOFT", "message": "...", "orderCount": N }
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteProduct(@PathVariable Long id){
        try {
            Map<String, Object> result = productService.deleteProduct(id);
            return ResponseEntity.ok(result);
        } catch (RuntimeException e){
            return ResponseEntity.status(404).body(e.getMessage());
        }
    }

    /** Kiểm tra sản phẩm có đơn hàng chưa (dùng để hiện cảnh báo trước khi xóa) */
    @GetMapping("/{id}/has-orders")
    public ResponseEntity<?> checkHasOrders(@PathVariable Long id){
        try {
            boolean hasOrders = productService.hasOrders(id);
            return ResponseEntity.ok(Map.of("hasOrders", hasOrders));
        } catch (RuntimeException e){
            return ResponseEntity.status(404).body(e.getMessage());
        }
    }

    // ─── THÙNG RÁC ─────────────────────────────────────────────────────────────

    /** Lấy danh sách sản phẩm trong Thùng rác */
    @GetMapping("/trash")
    public ResponseEntity<List<Product>> getTrash() {
        return ResponseEntity.ok(productService.getDeletedProducts());
    }

    /** Khôi phục sản phẩm từ Thùng rác */
    @PatchMapping("/{id}/restore")
    public ResponseEntity<?> restoreProduct(@PathVariable Long id){
        try {
            return ResponseEntity.ok(productService.restoreProduct(id));
        } catch (RuntimeException e){
            return ResponseEntity.status(400).body(e.getMessage());
        }
    }

    /** Xóa vĩnh viễn sản phẩm đang trong Thùng rác */
    @DeleteMapping("/{id}/permanent")
    public ResponseEntity<?> hardDeleteProduct(@PathVariable Long id){
        try {
            productService.hardDeleteProduct(id);
            return ResponseEntity.ok(Map.of("message", "Đã xóa vĩnh viễn sản phẩm."));
        } catch (RuntimeException e){
            return ResponseEntity.status(400).body(e.getMessage());
        }
    }
}
