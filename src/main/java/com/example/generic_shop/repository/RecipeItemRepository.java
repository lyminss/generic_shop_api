package com.example.generic_shop.repository;

import com.example.generic_shop.entity.RecipeItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RecipeItemRepository extends JpaRepository<RecipeItem, Long> {
    List<RecipeItem> findByProductId(Long productId);
    void deleteByProductId(Long productId);
    boolean existsByIngredientId(Long ingredientId);
}
