package com.example.generic_shop.service;

import com.example.generic_shop.entity.InventoryTransaction;
import com.example.generic_shop.enums.InventoryTransactionType;

import java.util.List;

public interface InventoryTransactionService {
    List<InventoryTransaction> getAllTransactions();
    List<InventoryTransaction> getTransactionsByIngredient(Long ingredientId);
    List<InventoryTransaction> getTransactionsByType(InventoryTransactionType type);
}
