package com.example.generic_shop.controller;

import com.example.generic_shop.entity.InventoryTransaction;
import com.example.generic_shop.enums.InventoryTransactionType;
import com.example.generic_shop.service.InventoryTransactionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/inventory-transactions")
@RequiredArgsConstructor
public class InventoryTransactionController {

    private final InventoryTransactionService inventoryTransactionService;

    @GetMapping
    public ResponseEntity<List<InventoryTransaction>> getAllTransactions(
            @RequestParam(required = false) Long ingredientId,
            @RequestParam(required = false) InventoryTransactionType type) {

        if (ingredientId != null) {
            return ResponseEntity.ok(inventoryTransactionService.getTransactionsByIngredient(ingredientId));
        }
        if (type != null) {
            return ResponseEntity.ok(inventoryTransactionService.getTransactionsByType(type));
        }
        return ResponseEntity.ok(inventoryTransactionService.getAllTransactions());
    }
}
