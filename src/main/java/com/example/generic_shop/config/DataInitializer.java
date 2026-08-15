package com.example.generic_shop.config;

import com.example.generic_shop.entity.Ingredient;
import com.example.generic_shop.entity.Product;
import com.example.generic_shop.entity.RecipeItem;
import com.example.generic_shop.entity.User;
import com.example.generic_shop.repository.IngredientRepository;
import com.example.generic_shop.repository.ProductRepository;
import com.example.generic_shop.repository.RecipeItemRepository;
import com.example.generic_shop.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.*;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final IngredientRepository ingredientRepository;
    private final RecipeItemRepository recipeItemRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        // 1. Seed Accounts
        seedAccounts();

        // 2. Seed Ingredients (Nguyên liệu)
        Map<String, Ingredient> ingMap = seedIngredients();

        // 3. Seed Products & Recipes (Sản phẩm & Công thức pha chế)
        seedProductsAndRecipes(ingMap);
    }

    private void seedAccounts() {
        seedAccount("admin@tuctactea.com", "admin123", "Quản Trị", "Admin", "0909123456", "ADMIN");
        seedAccount("user@tuctactea.com", "user123", "Khách Hàng", "Thân Thiết", "0909654321", "USER");
        seedAccount("staff@tuctactea.com", "staff123", "Thu Ngân", "Staff", "0909888999", "STAFF");
        seedAccount("barista@tuctactea.com", "barista123", "Pha Chế", "Barista", "0909777666", "BARISTA");
    }

    private void seedAccount(String email, String rawPassword, String firstName, String lastName, String phone, String role) {
        if (userRepository.findByEmail(email).isEmpty()) {
            User user = new User();
            user.setEmail(email);
            user.setPassword(passwordEncoder.encode(rawPassword));
            user.setFirstName(firstName);
            user.setLastName(lastName);
            user.setPhone(phone);
            user.setRole(role);
            userRepository.save(user);
            System.out.println(">>> Seeded Account [" + role + "]: " + email);
        }
    }

    private Map<String, Ingredient> seedIngredients() {
        Map<String, Ingredient> result = new HashMap<>();

        java.time.LocalDate today = java.time.LocalDate.now();
        Object[][] ingData = {
            {"NL001", "Cà Phê Hạt Arabica Thượng Hạng", "kg", 5.0, 1.0, 250000.0, today.plusDays(90), 0.0, null},
            {"NL002", "Sữa Tươi Thanh Trùng Vinamilk", "chai", 10.0, 2.0, 35000.0, today.plusDays(10), 1.0, today.plusDays(3)},
            {"NL003", "Sữa Đặc Ngôi Sao Phương Nam", "chai", 5.0, 1.0, 60000.0, today.plusDays(60), 1.0, today.plusDays(15)},
            {"NL004", "Lục Trà Thái Nguyên Đặc Sản", "kg", 3.0, 0.5, 300000.0, today.plusDays(120), 0.0, null},
            {"NL005", "Trà Đen Cốt Đậm Đượm Vị", "kg", 4.0, 0.5, 280000.0, today.plusDays(100), 0.0, null},
            {"NL006", "Đường Nước Thanh Ngọt Bắp", "chai", 8.0, 1.5, 20000.0, today.plusDays(180), 1.0, today.plusDays(30)},
            {"NL007", "Trân Châu Đen Dẻo Ô Long", "kg", 6.0, 1.0, 50000.0, today.plusDays(7), 1.0, today.plusDays(1)},
            {"NL008", "Bột Kem Béo Thực Vật Béo Ngậy", "kg", 5.0, 0.8, 120000.0, today.plusDays(45), 0.0, null},
            {"NL009", "Siro Đào Giòn Pháp Monin", "chai", 2.0, 0.4, 180000.0, today.plusDays(30), 1.0, today.plusDays(7)},
            {"NL010", "Siro Vải Thiều Ngâm Đường", "chai", 2.0, 0.4, 175000.0, today.plusDays(25), 0.0, null},
            {"NL011", "Sốt Matcha Uji Nhật Bản", "kg", 1.5, 0.3, 450000.0, today.plusDays(15), 0.5, today.plusDays(4)},
            {"NL012", "Kem Cheese Macchiato Béo Mặn", "chai", 3.0, 0.5, 150000.0, today.plusDays(5), 1.0, today.plusDays(2)}
        };

        for (Object[] item : ingData) {
            String code = (String) item[0];
            String name = (String) item[1];
            String unit = (String) item[2];
            Double currentStock = (Double) item[3];
            Double minAlert = (Double) item[4];
            Double costPrice = (Double) item[5];
            java.time.LocalDate expDate = (java.time.LocalDate) item[6];
            Double openedStock = (Double) item[7];
            java.time.LocalDate openedExpDate = (java.time.LocalDate) item[8];

            Ingredient ing = ingredientRepository.findByCode(code).orElseGet(() -> {
                Ingredient newIng = new Ingredient();
                newIng.setCode(code);
                newIng.setName(name);
                newIng.setUnit(unit);
                newIng.setCurrentStock(currentStock);
                newIng.setMinStockAlert(minAlert);
                newIng.setCostPrice(costPrice);
                newIng.setExpiryDate(expDate);
                newIng.setOpenedStock(openedStock);
                newIng.setOpenedExpiryDate(openedExpDate);
                return ingredientRepository.save(newIng);
            });

            // Sync units and values to kg / chai
            ing.setUnit(unit);
            ing.setCurrentStock(currentStock);
            ing.setMinStockAlert(minAlert);
            ing.setCostPrice(costPrice);
            ing.setExpiryDate(expDate);
            ing.setOpenedStock(openedStock);
            ing.setOpenedExpiryDate(openedExpDate);
            ingredientRepository.save(ing);

            result.put(code, ing);
        }




        System.out.println(">>> Seeded " + result.size() + " Ingredients successfully.");
        return result;
    }

    private void seedProductsAndRecipes(Map<String, Ingredient> ingMap) {
        // List of 10 Products with specs & recipe BOMs
        List<ProductSeedSpec> productsToSeed = Arrays.asList(
            new ProductSeedSpec(
                "Cà Phê Sữa Sài Gòn",
                "Cà phê phin đậm đà kết hợp sữa đặc béo ngậy chuẩn vị Sài Gòn truyền thống",
                "https://images.unsplash.com/photo-1541167760496-1628856ab772?w=500&auto=format&fit=crop",
                35000L, 100, "Cà Phê",
                Arrays.asList(
                    new RecipeSpec("NL001", 25.0),
                    new RecipeSpec("NL003", 30.0),
                    new RecipeSpec("NL006", 15.0)
                )
            ),
            new ProductSeedSpec(
                "Cà Phê Đen Đá Phin",
                "Cà phê nguyên chất Arabica đậm vị, đắng nhẹ hậu ngọt mượt mà",
                "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500&auto=format&fit=crop",
                29000L, 100, "Cà Phê",
                Arrays.asList(
                    new RecipeSpec("NL001", 25.0),
                    new RecipeSpec("NL006", 15.0)
                )
            ),
            new ProductSeedSpec(
                "Bạc Xỉu Sữa Tươi",
                "Nhiều sữa tươi béo thơm quyện cùng chút cà phê phin nhẹ nhàng dễ uống",
                "https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=500&auto=format&fit=crop",
                39000L, 100, "Cà Phê",
                Arrays.asList(
                    new RecipeSpec("NL001", 15.0),
                    new RecipeSpec("NL002", 80.0),
                    new RecipeSpec("NL003", 25.0)
                )
            ),
            new ProductSeedSpec(
                "Trà Sữa Truyền Thống Trân Châu",
                "Trà đen cốt đậm thơm ngát kết hợp bột kem béo và trân châu đen dẻo giòn",
                "https://images.unsplash.com/photo-1558857563-b371033873b8?w=500&auto=format&fit=crop",
                42000L, 100, "Trà Sữa",
                Arrays.asList(
                    new RecipeSpec("NL005", 15.0),
                    new RecipeSpec("NL008", 30.0),
                    new RecipeSpec("NL006", 20.0),
                    new RecipeSpec("NL007", 50.0)
                )
            ),
            new ProductSeedSpec(
                "Trà Sữa Ô Long Kem Cheese",
                "Trà Ô Long lưu hương ngát quyện trà sữa mịn màng cùng lớp kem cheese mặn béo",
                "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=500&auto=format&fit=crop",
                49000L, 100, "Trà Sữa",
                Arrays.asList(
                    new RecipeSpec("NL005", 15.0),
                    new RecipeSpec("NL008", 25.0),
                    new RecipeSpec("NL006", 20.0),
                    new RecipeSpec("NL012", 40.0)
                )
            ),
            new ProductSeedSpec(
                "Trà Sữa Matcha Uji Nhật Bản",
                "Bột Matcha chuẩn Uji Nhật Bản đậm đà béo ngậy quyện sữa tươi thanh mát",
                "https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=500&auto=format&fit=crop",
                45000L, 100, "Trà Sữa",
                Arrays.asList(
                    new RecipeSpec("NL011", 20.0),
                    new RecipeSpec("NL002", 100.0),
                    new RecipeSpec("NL003", 15.0),
                    new RecipeSpec("NL006", 15.0)
                )
            ),
            new ProductSeedSpec(
                "Trà Đào Cam Sả Giòn",
                "Trà xanh thanh mát kết hợp siro đào giòn Pháp ngạt ngào và hương cam sả sảng khoái",
                "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=500&auto=format&fit=crop",
                45000L, 100, "Trà Trái Cây",
                Arrays.asList(
                    new RecipeSpec("NL004", 10.0),
                    new RecipeSpec("NL009", 30.0),
                    new RecipeSpec("NL006", 15.0)
                )
            ),
            new ProductSeedSpec(
                "Trà Vải Lục Trà Thanh Mát",
                "Lục trà Thái Nguyên hòa quyện vị vải thiều ngâm ngọt lịm mọng nước",
                "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=500&auto=format&fit=crop",
                42000L, 100, "Trà Trái Cây",
                Arrays.asList(
                    new RecipeSpec("NL004", 10.0),
                    new RecipeSpec("NL010", 30.0),
                    new RecipeSpec("NL006", 15.0)
                )
            ),
            new ProductSeedSpec(
                "Lục Trà Macchiato Kem Béo",
                "Trà xanh thanh ngát đắng nhẹ đắp lớp váng kem Macchiato béo ngậy mặn mượt",
                "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=500&auto=format&fit=crop",
                39000L, 100, "Trà Đặc Sắc",
                Arrays.asList(
                    new RecipeSpec("NL004", 10.0),
                    new RecipeSpec("NL006", 15.0),
                    new RecipeSpec("NL012", 50.0)
                )
            ),
            new ProductSeedSpec(
                "Cà Phê Muối Kem Béo",
                "Cà phê phin đậm đà quyện kem muối mặn béo ngậy xu hướng cực cuốn",
                "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=500&auto=format&fit=crop",
                42000L, 100, "Cà Phê",
                Arrays.asList(
                    new RecipeSpec("NL001", 20.0),
                    new RecipeSpec("NL003", 20.0),
                    new RecipeSpec("NL012", 40.0)
                )
            )
        );

        for (ProductSeedSpec spec : productsToSeed) {
            Product product = productRepository.findByName(spec.name).orElseGet(() -> {
                Product p = new Product();
                p.setName(spec.name);
                p.setDescription(spec.description);
                p.setImage(spec.image);
                p.setPrice(spec.price);
                p.setStockQuantity(spec.stockQuantity);
                p.setCategory(spec.category);
                return productRepository.save(p);
            });

            // Seed Recipe Items if not exist
            List<RecipeItem> existingRecipes = recipeItemRepository.findByProductId(product.getId());
            if (existingRecipes.isEmpty()) {
                for (RecipeSpec rSpec : spec.recipes) {
                    Ingredient ing = ingMap.get(rSpec.ingredientCode);
                    if (ing != null) {
                        RecipeItem recipeItem = new RecipeItem();
                        recipeItem.setProduct(product);
                        recipeItem.setIngredient(ing);
                        recipeItem.setQuantity(rSpec.quantity);
                        recipeItem.setUnit(ing.getUnit());
                        recipeItemRepository.save(recipeItem);
                    }
                }
                System.out.println(">>> Seeded Recipe for Product: " + product.getName());
            }
        }
    }

    private static class ProductSeedSpec {
        String name;
        String description;
        String image;
        Long price;
        Integer stockQuantity;
        String category;
        List<RecipeSpec> recipes;

        ProductSeedSpec(String name, String description, String image, Long price, Integer stockQuantity, String category, List<RecipeSpec> recipes) {
            this.name = name;
            this.description = description;
            this.image = image;
            this.price = price;
            this.stockQuantity = stockQuantity;
            this.category = category;
            this.recipes = recipes;
        }
    }

    private static class RecipeSpec {
        String ingredientCode;
        Double quantity;

        RecipeSpec(String ingredientCode, Double quantity) {
            this.ingredientCode = ingredientCode;
            this.quantity = quantity;
        }
    }
}
