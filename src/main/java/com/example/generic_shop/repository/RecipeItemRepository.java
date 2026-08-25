package com.example.generic_shop.repository;

import com.example.generic_shop.entity.RecipeItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface RecipeItemRepository extends JpaRepository<RecipeItem, Long> {
    List<RecipeItem> findByProductId(Long productId);

    @Transactional
    @Modifying
    @Query("DELETE FROM RecipeItem ri WHERE ri.product.id = :productId")
    void deleteByProductId(Long productId);

    boolean existsByIngredientId(Long ingredientId);
}

