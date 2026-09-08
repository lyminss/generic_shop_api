package com.example.generic_shop.service.Impl;

import com.example.generic_shop.dto.CapacityDTOs;
import com.example.generic_shop.entity.Ingredient;
import com.example.generic_shop.entity.Product;
import com.example.generic_shop.entity.RecipeItem;
import com.example.generic_shop.repository.IngredientRepository;
import com.example.generic_shop.repository.ProductRepository;
import com.example.generic_shop.repository.RecipeItemRepository;
import com.example.generic_shop.service.ProductionCapacityService;
import com.example.generic_shop.util.UnitConverter;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductionCapacityServiceImpl implements ProductionCapacityService {

    private final ProductRepository productRepository;
    private final IngredientRepository ingredientRepository;
    private final RecipeItemRepository recipeItemRepository;

    @Override
    public CapacityDTOs.CapacityOverviewResponse calculateCapacityOverview() {
        List<Product> allProducts = productRepository.findAll();
        List<Ingredient> allIngredients = ingredientRepository.findAll();
        List<RecipeItem> allRecipeItems = recipeItemRepository.findAll();

        LocalDate today = LocalDate.now();

        // 1. Bản đồ tồn kho khả dụng của nguyên liệu (đã trừ nguyên liệu hết hạn)
        Map<Long, Double> usableStockMap = new HashMap<>();
        Map<Long, Boolean> expiredMap = new HashMap<>();

        for (Ingredient ing : allIngredients) {
            boolean sealedExpired = ing.getExpiryDate() != null && ing.getExpiryDate().isBefore(today);
            boolean openedExpired = ing.getOpenedExpiryDate() != null && ing.getOpenedStock() != null
                    && ing.getOpenedStock() > 0 && ing.getOpenedExpiryDate().isBefore(today);

            boolean isExpired = sealedExpired || openedExpired;
            expiredMap.put(ing.getId(), isExpired);

            if (isExpired) {
                usableStockMap.put(ing.getId(), 0.0);
            } else {
                double stock = ing.getCurrentStock() != null ? Math.max(0.0, ing.getCurrentStock()) : 0.0;
                usableStockMap.put(ing.getId(), stock);
            }
        }

        // Nhóm công thức theo productId
        Map<Long, List<RecipeItem>> recipesByProduct = allRecipeItems.stream()
                .filter(ri -> ri.getProduct() != null && ri.getProduct().getId() != null)
                .collect(Collectors.groupingBy(ri -> ri.getProduct().getId()));

        // 2. Phân tích khả năng độc lập của từng món
        List<CapacityDTOs.DishCapacityInfo> dishCapacities = new ArrayList<>();
        Map<Long, Integer> bottleneckCountMap = new HashMap<>(); // đếm số lần nguyên liệu làm nghẽn món
        Map<Long, Integer> usageCountMap = new HashMap<>();      // đếm số món dùng nguyên liệu

        int readyCount = 0;
        int outOfStockCount = 0;
        int stoppedCount = 0;

        for (Product product : allProducts) {
            boolean isStopped = "STOPPED".equalsIgnoreCase(product.getStatus());
            if (isStopped) {
                stoppedCount++;
                dishCapacities.add(CapacityDTOs.DishCapacityInfo.builder()
                        .productId(product.getId())
                        .productName(product.getName())
                        .category(product.getCategory())
                        .image(product.getImage())
                        .price(product.getPrice())
                        .status("STOPPED")
                        .stockQuantity(product.getStockQuantity())
                        .maxPossibleServings(0)
                        .statusTag("STOPPED")
                        .statusDescription("Món đang ngừng bán (Danh mục hoặc món tạm đóng)")
                        .recipeItemsCount(recipesByProduct.getOrDefault(product.getId(), Collections.emptyList()).size())
                        .build());
                continue;
            }

            List<RecipeItem> recipeItems = recipesByProduct.getOrDefault(product.getId(), Collections.emptyList());

            if (recipeItems.isEmpty()) {
                // Món không có công thức: Dùng tồn kho trực tiếp từ Product
                int stock = product.getStockQuantity();
                String tag = stock > 0 ? (stock >= 20 ? "ABUNDANT" : (stock >= 5 ? "AVAILABLE" : "LOW")) : "OUT_OF_STOCK";
                if (stock > 0) readyCount++; else outOfStockCount++;

                dishCapacities.add(CapacityDTOs.DishCapacityInfo.builder()
                        .productId(product.getId())
                        .productName(product.getName())
                        .category(product.getCategory())
                        .image(product.getImage())
                        .price(product.getPrice())
                        .status("ACTIVE")
                        .stockQuantity(stock)
                        .maxPossibleServings(stock)
                        .statusTag(tag)
                        .statusDescription(stock > 0 ? "Theo dõi qua tồn kho sản phẩm trực tiếp" : "Hết hàng trong kho")
                        .recipeItemsCount(0)
                        .build());
                continue;
            }

            // Món có công thức: Tính dựa trên tồn kho nguyên liệu
            int minPossibleServings = Integer.MAX_VALUE;
            Ingredient limitingIngredient = null;
            Double limitingAvailableStock = 0.0;
            Double limitingRequiredPerServing = 0.0;
            boolean hasExpiredIngredient = false;
            String expiredReason = null;

            for (RecipeItem ri : recipeItems) {
                Ingredient ing = ri.getIngredient();
                if (ing == null) continue;

                usageCountMap.put(ing.getId(), usageCountMap.getOrDefault(ing.getId(), 0) + 1);

                boolean isExpired = expiredMap.getOrDefault(ing.getId(), false);
                if (isExpired) {
                    hasExpiredIngredient = true;
                    limitingIngredient = ing;
                    limitingAvailableStock = 0.0;
                    limitingRequiredPerServing = UnitConverter.convertToIngredientUnit(ri.getQuantity(), ri.getUnit(), ing.getUnit());
                    minPossibleServings = 0;
                    expiredReason = "Nguyên liệu '" + ing.getName() + "' đã hết hạn";
                    break;
                }

                double requiredPerServing = UnitConverter.convertToIngredientUnit(ri.getQuantity(), ri.getUnit(), ing.getUnit());
                double availableStock = usableStockMap.getOrDefault(ing.getId(), 0.0);

                if (requiredPerServing > 0) {
                    int possible = (int) (availableStock / requiredPerServing);
                    if (possible < minPossibleServings) {
                        minPossibleServings = possible;
                        limitingIngredient = ing;
                        limitingAvailableStock = availableStock;
                        limitingRequiredPerServing = requiredPerServing;
                    }
                }
            }

            if (hasExpiredIngredient) {
                outOfStockCount++;
                if (limitingIngredient != null) {
                    bottleneckCountMap.put(limitingIngredient.getId(), bottleneckCountMap.getOrDefault(limitingIngredient.getId(), 0) + 1);
                }
                dishCapacities.add(CapacityDTOs.DishCapacityInfo.builder()
                        .productId(product.getId())
                        .productName(product.getName())
                        .category(product.getCategory())
                        .image(product.getImage())
                        .price(product.getPrice())
                        .status("ACTIVE")
                        .stockQuantity(product.getStockQuantity())
                        .maxPossibleServings(0)
                        .limitingIngredientId(limitingIngredient != null ? limitingIngredient.getId() : null)
                        .limitingIngredientCode(limitingIngredient != null ? limitingIngredient.getCode() : null)
                        .limitingIngredientName(limitingIngredient != null ? limitingIngredient.getName() : null)
                        .limitingIngredientUnit(limitingIngredient != null ? limitingIngredient.getUnit() : null)
                        .limitingAvailableStock(0.0)
                        .limitingRequiredPerServing(limitingRequiredPerServing)
                        .statusTag("EXPIRED_INGREDIENT")
                        .statusDescription(expiredReason)
                        .recipeItemsCount(recipeItems.size())
                        .build());
                continue;
            }

            int finalServings = minPossibleServings == Integer.MAX_VALUE ? 0 : Math.max(0, minPossibleServings);
            String statusTag;
            String statusDesc;

            if (finalServings == 0) {
                statusTag = "OUT_OF_STOCK";
                statusDesc = limitingIngredient != null
                        ? "Hết nguyên liệu '" + limitingIngredient.getName() + "'"
                        : "Không đủ nguyên liệu";
                outOfStockCount++;
            } else if (finalServings < 5) {
                statusTag = "LOW";
                statusDesc = "Sắp hết nguyên liệu (hạn chế bởi '" + (limitingIngredient != null ? limitingIngredient.getName() : "") + "')";
                readyCount++;
            } else if (finalServings < 20) {
                statusTag = "AVAILABLE";
                statusDesc = "Sẵn sàng phục vụ (tối đa " + finalServings + " ly)";
                readyCount++;
            } else {
                statusTag = "ABUNDANT";
                statusDesc = "Nguồn nguyên liệu dồi dào (" + finalServings + " ly)";
                readyCount++;
            }

            if (limitingIngredient != null) {
                bottleneckCountMap.put(limitingIngredient.getId(), bottleneckCountMap.getOrDefault(limitingIngredient.getId(), 0) + 1);
            }

            dishCapacities.add(CapacityDTOs.DishCapacityInfo.builder()
                    .productId(product.getId())
                    .productName(product.getName())
                    .category(product.getCategory())
                    .image(product.getImage())
                    .price(product.getPrice())
                    .status("ACTIVE")
                    .stockQuantity(product.getStockQuantity())
                    .maxPossibleServings(finalServings)
                    .limitingIngredientId(limitingIngredient != null ? limitingIngredient.getId() : null)
                    .limitingIngredientCode(limitingIngredient != null ? limitingIngredient.getCode() : null)
                    .limitingIngredientName(limitingIngredient != null ? limitingIngredient.getName() : null)
                    .limitingIngredientUnit(limitingIngredient != null ? limitingIngredient.getUnit() : null)
                    .limitingAvailableStock(limitingAvailableStock)
                    .limitingRequiredPerServing(limitingRequiredPerServing)
                    .statusTag(statusTag)
                    .statusDescription(statusDesc)
                    .recipeItemsCount(recipeItems.size())
                    .build());
        }

        // 3. Thuật toán phân bổ công suất đồng thời tối đa (Simultaneous Allocation Optimization)
        CapacityDTOs.CombinedCapacityPlan combinedPlan = optimizeSimultaneousProduction(
                allProducts, recipesByProduct, usableStockMap);

        // 4. Danh sách các nguyên liệu điểm nghẽn
        List<CapacityDTOs.BottleneckIngredientInfo> bottlenecks = new ArrayList<>();
        for (Ingredient ing : allIngredients) {
            int dependent = usageCountMap.getOrDefault(ing.getId(), 0);
            int blocked = bottleneckCountMap.getOrDefault(ing.getId(), 0);
            boolean isExpired = expiredMap.getOrDefault(ing.getId(), false);

            if (dependent > 0 || blocked > 0 || isExpired) {
                bottlenecks.add(CapacityDTOs.BottleneckIngredientInfo.builder()
                        .ingredientId(ing.getId())
                        .code(ing.getCode())
                        .name(ing.getName())
                        .unit(ing.getUnit())
                        .currentStock(ing.getCurrentStock())
                        .isExpired(isExpired)
                        .dishesDependentCount(dependent)
                        .dishesBlockedCount(blocked)
                        .build());
            }
        }
        // Sắp xếp nguyên liệu nghẽn theo số món bị chặn giảm dần
        bottlenecks.sort((a, b) -> Integer.compare(b.getDishesBlockedCount(), a.getDishesBlockedCount()));

        return CapacityDTOs.CapacityOverviewResponse.builder()
                .totalProducts(allProducts.size())
                .activeProducts(allProducts.size() - stoppedCount)
                .readyToServeProducts(readyCount)
                .outOfStockProducts(outOfStockCount)
                .stoppedProducts(stoppedCount)
                .totalCombinedMaxServings(combinedPlan.getTotalPossibleCombinedServings())
                .dishCapacities(dishCapacities)
                .combinedPlan(combinedPlan)
                .bottlenecks(bottlenecks)
                .build();
    }

    /**
     * Thuật toán tối ưu hóa phân bổ phục vụ đồng thời nhiều món:
     * Dùng Heuristic phân bổ tham lam có trọng số độ hiếm nguyên liệu
     */
    private CapacityDTOs.CombinedCapacityPlan optimizeSimultaneousProduction(
            List<Product> products,
            Map<Long, List<RecipeItem>> recipesByProduct,
            Map<Long, Double> initialUsableStock) {

        Map<Long, Double> virtualStock = new HashMap<>(initialUsableStock);

        // Lọc các món đang hoạt động và có công thức
        List<Product> eligibleProducts = products.stream()
                .filter(p -> !"STOPPED".equalsIgnoreCase(p.getStatus()))
                .filter(p -> recipesByProduct.containsKey(p.getId()) && !recipesByProduct.get(p.getId()).isEmpty())
                .collect(Collectors.toList());

        // Chuẩn bị cấu trúc tiêu hao cho từng món
        Map<Long, Map<Long, Double>> dishConsumptionMap = new HashMap<>();
        for (Product p : eligibleProducts) {
            Map<Long, Double> consumption = new HashMap<>();
            boolean hasExpired = false;

            for (RecipeItem ri : recipesByProduct.get(p.getId())) {
                Ingredient ing = ri.getIngredient();
                if (ing == null) continue;
                double req = UnitConverter.convertToIngredientUnit(ri.getQuantity(), ri.getUnit(), ing.getUnit());
                consumption.put(ing.getId(), consumption.getOrDefault(ing.getId(), 0.0) + req);
            }
            dishConsumptionMap.put(p.getId(), consumption);
        }

        // Tính trọng số khan hiếm của nguyên liệu
        Map<Long, Double> ingredientScarcity = new HashMap<>();
        for (Map.Entry<Long, Double> entry : virtualStock.entrySet()) {
            double stock = entry.getValue();
            // Càng ít hàng và càng nhiều món dùng -> trọng số khan hiếm càng cao
            long countDishesUsing = dishConsumptionMap.values().stream()
                    .filter(map -> map.containsKey(entry.getKey())).count();
            double scarcity = countDishesUsing / Math.max(stock, 0.001);
            ingredientScarcity.put(entry.getKey(), scarcity);
        }

        // Điểm hiệu quả của món = 1 / tổng chi phí tài nguyên khan hiếm
        eligibleProducts.sort((p1, p2) -> {
            double cost1 = dishConsumptionMap.get(p1.getId()).entrySet().stream()
                    .mapToDouble(e -> e.getValue() * ingredientScarcity.getOrDefault(e.getKey(), 1.0)).sum();
            double cost2 = dishConsumptionMap.get(p2.getId()).entrySet().stream()
                    .mapToDouble(e -> e.getValue() * ingredientScarcity.getOrDefault(e.getKey(), 1.0)).sum();
            return Double.compare(cost1, cost2);
        });

        // Vòng lặp phân bổ công bằng kết hợp tối ưu:
        Map<Long, Integer> allocatedServings = new HashMap<>();
        boolean canProduceAny = true;

        while (canProduceAny) {
            canProduceAny = false;
            for (Product p : eligibleProducts) {
                Map<Long, Double> consumption = dishConsumptionMap.get(p.getId());
                boolean canMakeThis = true;

                for (Map.Entry<Long, Double> entry : consumption.entrySet()) {
                    if (virtualStock.getOrDefault(entry.getKey(), 0.0) < entry.getValue()) {
                        canMakeThis = false;
                        break;
                    }
                }

                if (canMakeThis) {
                    // Trừ tồn kho ảo
                    for (Map.Entry<Long, Double> entry : consumption.entrySet()) {
                        virtualStock.put(entry.getKey(), virtualStock.get(entry.getKey()) - entry.getValue());
                    }
                    allocatedServings.put(p.getId(), allocatedServings.getOrDefault(p.getId(), 0) + 1);
                    canProduceAny = true;
                }
            }
        }

        int totalCombined = allocatedServings.values().stream().mapToInt(Integer::intValue).sum();

        List<CapacityDTOs.DishAllocation> allocations = new ArrayList<>();
        for (Product p : eligibleProducts) {
            int allocated = allocatedServings.getOrDefault(p.getId(), 0);
            if (allocated > 0) {
                allocations.add(CapacityDTOs.DishAllocation.builder()
                        .productId(p.getId())
                        .productName(p.getName())
                        .category(p.getCategory())
                        .allocatedServings(allocated)
                        .price(p.getPrice())
                        .build());
            }
        }

        allocations.sort((a, b) -> Integer.compare(b.getAllocatedServings(), a.getAllocatedServings()));

        return CapacityDTOs.CombinedCapacityPlan.builder()
                .totalPossibleCombinedServings(totalCombined)
                .allocations(allocations)
                .algorithmDescription("Thuật toán phân bổ đa chiều đồng thời: Tối đa hóa tổng số ly phục vụ trên nguồn nguyên liệu dùng chung")
                .build();
    }

    @Override
    public CapacityDTOs.SimulationResultResponse simulateProduction(CapacityDTOs.SimulationRequest request) {
        if (request == null || request.getItems() == null || request.getItems().isEmpty()) {
            throw new RuntimeException("Danh sách món mô phỏng không được để trống");
        }

        List<Ingredient> allIngredients = ingredientRepository.findAll();
        Map<Long, Ingredient> ingredientMap = allIngredients.stream()
                .collect(Collectors.toMap(Ingredient::getId, ing -> ing));

        Map<Long, Double> currentStockMap = allIngredients.stream()
                .collect(Collectors.toMap(
                        Ingredient::getId,
                        ing -> ing.getCurrentStock() != null ? Math.max(0.0, ing.getCurrentStock()) : 0.0
                ));

        Map<Long, Double> totalNeededMap = new HashMap<>();
        int totalServings = 0;
        List<String> errors = new ArrayList<>();

        for (CapacityDTOs.SimulationItemRequest item : request.getItems()) {
            if (item.getQuantity() == null || item.getQuantity() <= 0) continue;
            totalServings += item.getQuantity();

            Product product = productRepository.findById(item.getProductId()).orElse(null);
            if (product == null) {
                errors.add("Không tìm thấy món với ID: " + item.getProductId());
                continue;
            }

            if ("STOPPED".equalsIgnoreCase(product.getStatus())) {
                errors.add("Món '" + product.getName() + "' hiện đang ngừng bán, không thể đưa vào kế hoạch pha chế!");
            }

            List<RecipeItem> recipeItems = recipeItemRepository.findByProductId(product.getId());
            for (RecipeItem ri : recipeItems) {
                Ingredient ing = ri.getIngredient();
                if (ing == null) continue;

                double reqPerDish = UnitConverter.convertToIngredientUnit(ri.getQuantity(), ri.getUnit(), ing.getUnit());
                double totalDishNeeded = reqPerDish * item.getQuantity();
                totalNeededMap.put(ing.getId(), totalNeededMap.getOrDefault(ing.getId(), 0.0) + totalDishNeeded);
            }
        }

        // Kiểm tra tính khả thi và tiêu hao
        boolean isFeasible = true;
        List<CapacityDTOs.IngredientConsumption> consumptions = new ArrayList<>();

        for (Map.Entry<Long, Double> entry : totalNeededMap.entrySet()) {
            Long ingId = entry.getKey();
            Double needed = entry.getValue();
            Double available = currentStockMap.getOrDefault(ingId, 0.0);
            Ingredient ing = ingredientMap.get(ingId);

            boolean deficient = available < needed;
            if (deficient) {
                isFeasible = false;
            }

            double remaining = Math.max(0.0, available - needed);
            consumptions.add(CapacityDTOs.IngredientConsumption.builder()
                    .ingredientId(ingId)
                    .code(ing != null ? ing.getCode() : "")
                    .name(ing != null ? ing.getName() : "")
                    .consumedQuantity(needed)
                    .initialStock(available)
                    .remainingStock(remaining)
                    .unit(ing != null ? ing.getUnit() : "")
                    .isDeficient(deficient)
                    .deficientQuantity(deficient ? (needed - available) : 0.0)
                    .build());
        }

        // Tính toán khả năng còn lại của các món sau khi trừ số lượng đã mô phỏng
        Map<Long, Double> remainingStockMap = new HashMap<>(currentStockMap);
        for (CapacityDTOs.IngredientConsumption c : consumptions) {
            remainingStockMap.put(c.getIngredientId(), c.getRemainingStock());
        }

        List<CapacityDTOs.DishCapacityInfo> remainingDishCapacities = new ArrayList<>();
        List<Product> allProducts = productRepository.findAll();
        List<RecipeItem> allRecipeItems = recipeItemRepository.findAll();
        Map<Long, List<RecipeItem>> recipesByProduct = allRecipeItems.stream()
                .filter(ri -> ri.getProduct() != null && ri.getProduct().getId() != null)
                .collect(Collectors.groupingBy(ri -> ri.getProduct().getId()));

        for (Product product : allProducts) {
            if ("STOPPED".equalsIgnoreCase(product.getStatus())) continue;

            List<RecipeItem> recipeItems = recipesByProduct.getOrDefault(product.getId(), Collections.emptyList());
            if (recipeItems.isEmpty()) continue;

            int minPossible = Integer.MAX_VALUE;
            Ingredient limiting = null;
            double limitingStock = 0.0;
            double limitingReq = 0.0;

            for (RecipeItem ri : recipeItems) {
                Ingredient ing = ri.getIngredient();
                if (ing == null) continue;

                double req = UnitConverter.convertToIngredientUnit(ri.getQuantity(), ri.getUnit(), ing.getUnit());
                double stock = remainingStockMap.getOrDefault(ing.getId(), 0.0);
                if (req > 0) {
                    int possible = (int) (stock / req);
                    if (possible < minPossible) {
                        minPossible = possible;
                        limiting = ing;
                        limitingStock = stock;
                        limitingReq = req;
                    }
                }
            }

            remainingDishCapacities.add(CapacityDTOs.DishCapacityInfo.builder()
                    .productId(product.getId())
                    .productName(product.getName())
                    .category(product.getCategory())
                    .maxPossibleServings(minPossible == Integer.MAX_VALUE ? 0 : minPossible)
                    .limitingIngredientName(limiting != null ? limiting.getName() : null)
                    .limitingAvailableStock(limitingStock)
                    .limitingRequiredPerServing(limitingReq)
                    .statusTag(minPossible > 0 ? "AVAILABLE" : "OUT_OF_STOCK")
                    .build());
        }

        return CapacityDTOs.SimulationResultResponse.builder()
                .isFeasible(isFeasible)
                .totalRequestedServings(totalServings)
                .consumptions(consumptions)
                .errorMessages(errors)
                .remainingDishCapacities(remainingDishCapacities)
                .build();
    }
}
