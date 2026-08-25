package com.example.generic_shop.service.Impl;

import com.example.generic_shop.entity.Product;
import com.example.generic_shop.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

import com.example.generic_shop.service.ProductService;

@Service
@RequiredArgsConstructor
public class ProductServiceImpl implements ProductService {
    private final ProductRepository productRepository;
    private final com.example.generic_shop.repository.RecipeItemRepository recipeItemRepository;

    //Get all
    @Override
    public List<Product> getAll(){
        List<Product> products = productRepository.findAll();
        products.forEach(this::evaluateProductAvailability);
        return products;
    }

    //Get filtered (search + category)
    @Override
    public List<Product> getFiltered(String category, String search) {
        List<Product> products = productRepository.findFiltered(category, search);
        products.forEach(this::evaluateProductAvailability);
        return products;
    }

    //Get distinct categories
    @Override
    public List<String> getCategories() {
        return productRepository.findAll().stream()
                .map(Product::getCategory)
                .filter(c -> c != null && !c.isBlank())
                .distinct()
                .sorted()
                .collect(Collectors.toList());
    }

    //Get by id
    @Override
    public Product getById(Long id){
        Product product = productRepository.findById(id).orElseThrow(() -> new RuntimeException("Not found" +id));
        evaluateProductAvailability(product);
        return product;
    }

    private void evaluateProductAvailability(Product product) {
        if (product == null) return;
        java.time.LocalDate today = java.time.LocalDate.now();

        if (product.getStockQuantity() <= 0) {
            product.setAvailable(false);
            product.setUnavailableReason("Hết món");
            product.setMaxServingsAvailable(0);
            return;
        }

        List<com.example.generic_shop.entity.RecipeItem> recipeItems = recipeItemRepository.findByProductId(product.getId());
        if (recipeItems == null || recipeItems.isEmpty()) {
            product.setAvailable(true);
            product.setMaxServingsAvailable(product.getStockQuantity());
            return;
        }

        int minServingsFromIngredients = Integer.MAX_VALUE;

        for (com.example.generic_shop.entity.RecipeItem ri : recipeItems) {
            com.example.generic_shop.entity.Ingredient ing = ri.getIngredient();
            if (ing == null) continue;

            // 1. Kiểm tra nguyên liệu hết hạn
            boolean sealedExpired = ing.getExpiryDate() != null && ing.getExpiryDate().isBefore(today);
            boolean openedExpired = ing.getOpenedExpiryDate() != null && ing.getOpenedStock() != null && ing.getOpenedStock() > 0 && ing.getOpenedExpiryDate().isBefore(today);

            if (sealedExpired || openedExpired) {
                product.setAvailable(false);
                String expDateStr = sealedExpired ? String.valueOf(ing.getExpiryDate()) : String.valueOf(ing.getOpenedExpiryDate());
                product.setUnavailableReason("Tạm ngưng: Nguyên liệu '" + ing.getName() + "' đã hết hạn sử dụng (" + expDateStr + ")");
                product.setMaxServingsAvailable(0);
                return;
            }

            // 2. Kiểm tra tồn kho nguyên liệu với UnitConverter
            double requiredPerServing = com.example.generic_shop.util.UnitConverter.convertToIngredientUnit(ri.getQuantity(), ri.getUnit(), ing.getUnit());
            double currentStock = ing.getCurrentStock() != null ? ing.getCurrentStock() : 0.0;

            if (requiredPerServing > 0) {
                int possible = (int) (currentStock / requiredPerServing);
                if (possible < minServingsFromIngredients) {
                    minServingsFromIngredients = possible;
                }
                if (currentStock < requiredPerServing) {
                    product.setAvailable(false);
                    product.setUnavailableReason("Tạm ngưng: Hết nguyên liệu '" + ing.getName() + "'");
                    product.setMaxServingsAvailable(0);
                    return;
                }
            }
        }

        product.setAvailable(true);
        product.setMaxServingsAvailable(Math.min(product.getStockQuantity(), minServingsFromIngredients == Integer.MAX_VALUE ? product.getStockQuantity() : minServingsFromIngredients));
    }


    //Create
    @Override
    public Product createProduct(Product product){
        if (product.getName() == null || product.getName().isEmpty()){
            throw new RuntimeException("Product name is required");
        }
        if (product.getPrice() <= 0) {
            throw new RuntimeException("Product price must be greater than 0");
        }
        if (product.getStockQuantity() < 0) {
            throw new RuntimeException("Stock quantity must not be negative");
        }
        return productRepository.save(product);
    }

    //update
    @Override
    public Product updateProduct(Long id, Product request){
        Product product = getById(id);

        if (request.getName() == null || request.getName().isEmpty()) {
            throw new RuntimeException("Product name is required");
        }
        if (request.getPrice() <= 0) {
            throw new RuntimeException("Product price must be greater than 0");
        }
        if (request.getStockQuantity() < 0) {
            throw new RuntimeException("Stock quantity must not be negative");
        }

        product.setName(request.getName());
        product.setDescription(request.getDescription());
        product.setImage(request.getImage());
        product.setPrice(request.getPrice());
        product.setStockQuantity(request.getStockQuantity());
        product.setCategory(request.getCategory());

        return productRepository.save(product);
    }

    //delete
    @Override
    public void deleteProduct(Long id){
        Product product = getById(id);
        productRepository.delete(product);
    }

}
