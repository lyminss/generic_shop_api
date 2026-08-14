package com.example.generic_shop.controller;

import com.example.generic_shop.dto.RecipeDTOs;
import com.example.generic_shop.service.RecipeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/recipes")
@RequiredArgsConstructor
public class RecipeController {

    private final RecipeService recipeService;

    @GetMapping("/product/{productId}")
    public ResponseEntity<?> getRecipeByProductId(@PathVariable Long productId) {
        try {
            return ResponseEntity.ok(recipeService.getRecipeByProductId(productId));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping
    public ResponseEntity<?> saveRecipe(@RequestBody RecipeDTOs.RecipeSaveRequest request) {
        try {
            return ResponseEntity.ok(recipeService.saveProductRecipe(request));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/item/{id}")
    public ResponseEntity<?> deleteRecipeItem(@PathVariable Long id) {
        try {
            recipeService.deleteRecipeItem(id);
            return ResponseEntity.ok("Xóa dòng thành phần công thức thành công");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
