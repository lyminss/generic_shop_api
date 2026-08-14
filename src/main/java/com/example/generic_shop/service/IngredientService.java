package com.example.generic_shop.service;

import com.example.generic_shop.entity.Ingredient;

import java.util.List;

public interface IngredientService {
    List<Ingredient> getAllIngredients();
    List<Ingredient> getLowStockIngredients();
    Ingredient getIngredientById(Long id);
    Ingredient createIngredient(Ingredient ingredient);
    Ingredient updateIngredient(Long id, Ingredient ingredient);
    void deleteIngredient(Long id);
}
