package com.example.generic_shop.service.Impl;

import com.example.generic_shop.entity.Ingredient;
import com.example.generic_shop.repository.IngredientRepository;
import com.example.generic_shop.repository.RecipeItemRepository;
import com.example.generic_shop.service.IngredientService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class IngredientServiceImpl implements IngredientService {

    private final IngredientRepository ingredientRepository;
    private final RecipeItemRepository recipeItemRepository;

    @Override
    public List<Ingredient> getAllIngredients() {
        return ingredientRepository.findAll();
    }

    @Override
    public List<Ingredient> getLowStockIngredients() {
        return ingredientRepository.findLowStockIngredients();
    }

    @Override
    public Ingredient getIngredientById(Long id) {
        return ingredientRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy nguyên liệu có ID: " + id));
    }

    @Transactional
    @Override
    public Ingredient createIngredient(Ingredient ingredient) {
        if (ingredient.getCode() == null || ingredient.getCode().isBlank()) {
            // Tự tạo mã nếu chưa có: NL001, NL002...
            long count = ingredientRepository.count() + 1;
            ingredient.setCode(String.format("NL%03d", count));
        }
        if (ingredientRepository.existsByCode(ingredient.getCode())) {
            throw new RuntimeException("Mã nguyên liệu đã tồn tại: " + ingredient.getCode());
        }
        if (ingredient.getCurrentStock() == null) ingredient.setCurrentStock(0.0);
        if (ingredient.getMinStockAlert() == null) ingredient.setMinStockAlert(0.0);
        if (ingredient.getCostPrice() == null) ingredient.setCostPrice(0.0);

        return ingredientRepository.save(ingredient);
    }

    @Transactional
    @Override
    public Ingredient updateIngredient(Long id, Ingredient ingredientDetails) {
        Ingredient existing = getIngredientById(id);
        existing.setName(ingredientDetails.getName());
        existing.setUnit(ingredientDetails.getUnit());
        if (ingredientDetails.getMinStockAlert() != null) {
            existing.setMinStockAlert(ingredientDetails.getMinStockAlert());
        }
        if (ingredientDetails.getCostPrice() != null) {
            existing.setCostPrice(ingredientDetails.getCostPrice());
        }
        return ingredientRepository.save(existing);
    }

    @Transactional
    @Override
    public void deleteIngredient(Long id) {
        Ingredient existing = getIngredientById(id);
        if (recipeItemRepository.existsByIngredientId(id)) {
            throw new RuntimeException("Không thể xóa nguyên liệu đang được sử dụng trong công thức pha chế");
        }
        ingredientRepository.delete(existing);
    }
}
