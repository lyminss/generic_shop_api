package com.example.generic_shop.repository;

import com.example.generic_shop.entity.InventoryTransaction;
import com.example.generic_shop.enums.InventoryTransactionType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InventoryTransactionRepository extends JpaRepository<InventoryTransaction, Long> {
    List<InventoryTransaction> findAllByOrderByCreatedAtDesc();
    List<InventoryTransaction> findByIngredientIdOrderByCreatedAtDesc(Long ingredientId);
    List<InventoryTransaction> findByTypeOrderByCreatedAtDesc(InventoryTransactionType type);
}
