package com.example.generic_shop.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

public class RecipeDTOs {

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class RecipeItemInput {
        private Long ingredientId;
        private Double quantity;
        private String unit;
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class RecipeSaveRequest {
        private Long productId;
        private List<RecipeItemInput> items;
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class RecipeItemResponse {
        private Long id;
        private Long ingredientId;
        private String ingredientCode;
        private String ingredientName;
        private String ingredientUnit;
        private Double currentIngredientStock;
        private Double quantity;
        private String unit;
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class ProductRecipeDetails {
        private Long productId;
        private String productName;
        private List<RecipeItemResponse> recipeItems;
        private Integer maxServingsAvailable; // Số ly/phần tối đa có thể pha chế với kho hiện tại
    }
}
