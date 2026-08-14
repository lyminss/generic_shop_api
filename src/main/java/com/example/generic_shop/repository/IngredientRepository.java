package com.example.generic_shop.repository;

import com.example.generic_shop.entity.Ingredient;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface IngredientRepository extends JpaRepository<Ingredient, Long> {
    Optional<Ingredient> findByCode(String code);
    boolean existsByCode(String code);

    @Query("SELECT i FROM Ingredient i WHERE i.currentStock <= i.minStockAlert")
    List<Ingredient> findLowStockIngredients();

    List<Ingredient> findByNameContainingIgnoreCaseOrCodeContainingIgnoreCase(String name, String code);
}
