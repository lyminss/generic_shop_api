package com.example.generic_shop.controller;

import com.example.generic_shop.dto.StockReceiptDTOs;
import com.example.generic_shop.entity.StockReceipt;
import com.example.generic_shop.service.StockReceiptService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/stock-receipts")
@RequiredArgsConstructor
public class StockReceiptController {

    private final StockReceiptService stockReceiptService;

    @GetMapping
    public ResponseEntity<List<StockReceipt>> getAllReceipts() {
        return ResponseEntity.ok(stockReceiptService.getAllStockReceipts());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getReceiptById(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(stockReceiptService.getStockReceiptById(id));
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(e.getMessage());
        }
    }

    @PostMapping
    public ResponseEntity<?> createReceipt(@RequestBody StockReceiptDTOs.CreateStockReceiptRequest request) {
        try {
            return ResponseEntity.status(201).body(stockReceiptService.createStockReceipt(request));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
