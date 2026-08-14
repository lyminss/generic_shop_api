package com.example.generic_shop.controller;

import com.example.generic_shop.dto.StockAdjustmentDTOs;
import com.example.generic_shop.entity.StockAdjustment;
import com.example.generic_shop.service.StockAdjustmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/stock-adjustments")
@RequiredArgsConstructor
public class StockAdjustmentController {

    private final StockAdjustmentService stockAdjustmentService;

    @GetMapping
    public ResponseEntity<List<StockAdjustment>> getAllAdjustments() {
        return ResponseEntity.ok(stockAdjustmentService.getAllStockAdjustments());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getAdjustmentById(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(stockAdjustmentService.getStockAdjustmentById(id));
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(e.getMessage());
        }
    }

    @PostMapping
    public ResponseEntity<?> createAdjustment(@RequestBody StockAdjustmentDTOs.CreateStockAdjustmentRequest request) {
        try {
            return ResponseEntity.status(201).body(stockAdjustmentService.createStockAdjustment(request));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
