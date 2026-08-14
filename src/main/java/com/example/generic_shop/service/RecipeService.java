package com.example.generic_shop.service;

import com.example.generic_shop.dto.RecipeDTOs;

public interface RecipeService {
    RecipeDTOs.ProductRecipeDetails getRecipeByProductId(Long productId);
    RecipeDTOs.ProductRecipeDetails saveProductRecipe(RecipeDTOs.RecipeSaveRequest request);
    void deleteRecipeItem(Long recipeItemId);
}
