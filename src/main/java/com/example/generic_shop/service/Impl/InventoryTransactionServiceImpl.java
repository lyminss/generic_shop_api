package com.example.generic_shop.service.Impl;

import com.example.generic_shop.entity.InventoryTransaction;
import com.example.generic_shop.enums.InventoryTransactionType;
import com.example.generic_shop.repository.InventoryTransactionRepository;
import com.example.generic_shop.service.InventoryTransactionService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class InventoryTransactionServiceImpl implements InventoryTransactionService {

    private final InventoryTransactionRepository inventoryTransactionRepository;

    @Override
    public List<InventoryTransaction> getAllTransactions() {
        return inventoryTransactionRepository.findAllByOrderByCreatedAtDesc();
    }

    @Override
    public List<InventoryTransaction> getTransactionsByIngredient(Long ingredientId) {
        return inventoryTransactionRepository.findByIngredientIdOrderByCreatedAtDesc(ingredientId);
    }

    @Override
    public List<InventoryTransaction> getTransactionsByType(InventoryTransactionType type) {
        return inventoryTransactionRepository.findByTypeOrderByCreatedAtDesc(type);
    }
}
