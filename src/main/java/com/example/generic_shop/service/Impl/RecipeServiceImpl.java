package com.example.generic_shop.service.Impl;

import com.example.generic_shop.dto.RecipeDTOs;
import com.example.generic_shop.entity.Ingredient;
import com.example.generic_shop.entity.Product;
import com.example.generic_shop.entity.RecipeItem;
import com.example.generic_shop.repository.IngredientRepository;
import com.example.generic_shop.repository.ProductRepository;
import com.example.generic_shop.repository.RecipeItemRepository;
import com.example.generic_shop.service.RecipeService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class RecipeServiceImpl implements RecipeService {

    private final RecipeItemRepository recipeItemRepository;
    private final ProductRepository productRepository;
    private final IngredientRepository ingredientRepository;

    @Override
    public RecipeDTOs.ProductRecipeDetails getRecipeByProductId(Long productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Sản phẩm không tồn tại với ID: " + productId));

        List<RecipeItem> items = recipeItemRepository.findByProductId(productId);
        return buildDetailsResponse(product, items);
    }

    @Transactional
    @Override
    public RecipeDTOs.ProductRecipeDetails saveProductRecipe(RecipeDTOs.RecipeSaveRequest request) {
        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new RuntimeException("Sản phẩm không tồn tại với ID: " + request.getProductId()));

        // Xóa công thức cũ
        recipeItemRepository.deleteByProductId(request.getProductId());

        List<RecipeItem> savedItems = new ArrayList<>();
        if (request.getItems() != null) {
            for (RecipeDTOs.RecipeItemInput input : request.getItems()) {
                Ingredient ingredient = ingredientRepository.findById(input.getIngredientId())
                        .orElseThrow(() -> new RuntimeException("Nguyên liệu không tồn tại với ID: " + input.getIngredientId()));

                RecipeItem recipeItem = new RecipeItem();
                recipeItem.setProduct(product);
                recipeItem.setIngredient(ingredient);
                recipeItem.setQuantity(input.getQuantity());
                recipeItem.setUnit(input.getUnit() != null ? input.getUnit() : ingredient.getUnit());

                savedItems.add(recipeItemRepository.save(recipeItem));
            }
        }

        return buildDetailsResponse(product, savedItems);
    }

    @Transactional
    @Override
    public void deleteRecipeItem(Long recipeItemId) {
        recipeItemRepository.deleteById(recipeItemId);
    }

    private RecipeDTOs.ProductRecipeDetails buildDetailsResponse(Product product, List<RecipeItem> items) {
        RecipeDTOs.ProductRecipeDetails response = new RecipeDTOs.ProductRecipeDetails();
        response.setProductId(product.getId());
        response.setProductName(product.getName());

        List<RecipeDTOs.RecipeItemResponse> itemResponses = new ArrayList<>();
        int minPossibleServings = Integer.MAX_VALUE;

        for (RecipeItem item : items) {
            Ingredient ing = item.getIngredient();
            RecipeDTOs.RecipeItemResponse dto = new RecipeDTOs.RecipeItemResponse();
            dto.setId(item.getId());
            dto.setIngredientId(ing.getId());
            dto.setIngredientCode(ing.getCode());
            dto.setIngredientName(ing.getName());
            dto.setIngredientUnit(ing.getUnit());
            dto.setCurrentIngredientStock(ing.getCurrentStock());
            dto.setQuantity(item.getQuantity());
            dto.setUnit(item.getUnit());

            itemResponses.add(dto);

            if (item.getQuantity() > 0) {
                int possibleForThisIngredient = (int) (ing.getCurrentStock() / item.getQuantity());
                if (possibleForThisIngredient < minPossibleServings) {
                    minPossibleServings = possibleForThisIngredient;
                }
            }
        }

        response.setRecipeItems(itemResponses);
        response.setMaxServingsAvailable(items.isEmpty() ? 0 : Math.max(0, minPossibleServings));

        return response;
    }
}
