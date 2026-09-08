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
    private final com.example.generic_shop.repository.InventoryTransactionRepository inventoryTransactionRepository;

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
        if (ingredientDetails.getExpiryDate() != null) {
            existing.setExpiryDate(ingredientDetails.getExpiryDate());
        }
        if (ingredientDetails.getOpenedStock() != null) {
            existing.setOpenedStock(ingredientDetails.getOpenedStock());
        }
        if (ingredientDetails.getOpenedExpiryDate() != null) {
            existing.setOpenedExpiryDate(ingredientDetails.getOpenedExpiryDate());
        }
        // Unit conversion fields
        existing.setPurchaseUnit(ingredientDetails.getPurchaseUnit()); // nullable — null means same as unit
        if (ingredientDetails.getConversionRate() != null && ingredientDetails.getConversionRate() > 0) {
            existing.setConversionRate(ingredientDetails.getConversionRate());
        } else {
            existing.setConversionRate(1.0);
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

    @Transactional
    @Override
    public Ingredient discardExpiredStock(Long id) {
        Ingredient ing = getIngredientById(id);
        java.time.LocalDate today = java.time.LocalDate.now();

        boolean sealedExpired = ing.getExpiryDate() != null && ing.getExpiryDate().isBefore(today);
        boolean openedExpired = ing.getOpenedExpiryDate() != null && ing.getOpenedStock() != null && ing.getOpenedStock() > 0 && ing.getOpenedExpiryDate().isBefore(today);

        if (!sealedExpired && !openedExpired) {
            throw new RuntimeException("Nguyên liệu '" + ing.getName() + "' chưa hết hạn sử dụng!");
        }

        double beforeStock = ing.getCurrentStock() != null ? ing.getCurrentStock() : 0.0;
        double discardedAmount = 0.0;
        String noteReason = "";

        if (sealedExpired) {
            discardedAmount = beforeStock;
            noteReason = "Xuất hủy toàn bộ tồn do hết hạn tem nguyên (HSD cũ: " + ing.getExpiryDate() + ")";
            ing.setCurrentStock(0.0);
            ing.setOpenedStock(0.0);
            ing.setExpiryDate(null);
            ing.setOpenedExpiryDate(null);
        } else if (openedExpired) {
            double opened = ing.getOpenedStock() != null ? ing.getOpenedStock() : 0.0;
            discardedAmount = Math.min(beforeStock, opened);
            noteReason = "Xuất hủy phần mở nắp quá hạn (HSD mở nắp cũ: " + ing.getOpenedExpiryDate() + ")";
            double newStock = Math.max(0.0, beforeStock - discardedAmount);
            ing.setCurrentStock(newStock);
            ing.setOpenedStock(0.0);
            ing.setOpenedExpiryDate(null);
            if (newStock <= 0) {
                ing.setExpiryDate(null);
            }
        }

        Ingredient saved = ingredientRepository.save(ing);

        if (discardedAmount > 0) {
            com.example.generic_shop.entity.InventoryTransaction tx = new com.example.generic_shop.entity.InventoryTransaction();
            tx.setIngredient(saved);
            tx.setType(com.example.generic_shop.enums.InventoryTransactionType.EXPIRED_DISCARD);
            tx.setQuantity(-discardedAmount);
            tx.setStockBefore(beforeStock);
            tx.setStockAfter(saved.getCurrentStock());
            tx.setReferenceCode("EXP-" + ing.getCode() + "-" + (System.currentTimeMillis() % 100000));
            tx.setNote(noteReason);
            inventoryTransactionRepository.save(tx);
        }

        return saved;
    }

    @Transactional
    @Override
    public java.util.List<Ingredient> discardAllExpiredStock() {
        java.util.List<Ingredient> all = ingredientRepository.findAll();
        java.util.List<Ingredient> result = new java.util.ArrayList<>();
        java.time.LocalDate today = java.time.LocalDate.now();

        for (Ingredient ing : all) {
            boolean sealedExpired = ing.getExpiryDate() != null && ing.getExpiryDate().isBefore(today);
            boolean openedExpired = ing.getOpenedExpiryDate() != null && ing.getOpenedExpiryDate().isBefore(today);
            if (sealedExpired || openedExpired) {
                result.add(discardExpiredStock(ing.getId()));
            }
        }
        return result;
    }
}

