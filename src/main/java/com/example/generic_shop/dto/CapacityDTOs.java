package com.example.generic_shop.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;
import java.util.Map;

public class CapacityDTOs {

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DishCapacityInfo {
        private Long productId;
        private String productName;
        private String category;
        private String image;
        private Long price;
        private String status; // "ACTIVE" / "STOPPED"
        private Integer stockQuantity;
        private Integer maxPossibleServings; // Số ly tối đa có thể pha chế riêng món này
        private Long limitingIngredientId;
        private String limitingIngredientCode;
        private String limitingIngredientName;
        private String limitingIngredientUnit;
        private Double limitingAvailableStock;
        private Double limitingRequiredPerServing;
        private String statusTag; // "ABUNDANT", "AVAILABLE", "LOW", "OUT_OF_STOCK", "EXPIRED_INGREDIENT", "STOPPED"
        private String statusDescription;
        private int recipeItemsCount;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CombinedCapacityPlan {
        private Integer totalPossibleCombinedServings; // Tổng số ly toàn quán có thể làm đồng thời
        private List<DishAllocation> allocations; // Phân bổ chi tiết số ly từng món
        private String algorithmDescription;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DishAllocation {
        private Long productId;
        private String productName;
        private String category;
        private Integer allocatedServings;
        private Long price;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class BottleneckIngredientInfo {
        private Long ingredientId;
        private String code;
        private String name;
        private String unit;
        private Double currentStock;
        private Boolean isExpired;
        private int dishesDependentCount; // Số món dùng nguyên liệu này
        private int dishesBlockedCount;   // Số món đang bị nghẽn do thiếu nguyên liệu này
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CapacityOverviewResponse {
        private Integer totalProducts;
        private Integer activeProducts;
        private Integer readyToServeProducts;
        private Integer outOfStockProducts;
        private Integer stoppedProducts;
        private Integer totalCombinedMaxServings; // Công suất phục vụ đồng thời tối đa toàn quán
        private List<DishCapacityInfo> dishCapacities;
        private CombinedCapacityPlan combinedPlan;
        private List<BottleneckIngredientInfo> bottlenecks;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SimulationItemRequest {
        private Long productId;
        private Integer quantity;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SimulationRequest {
        private List<SimulationItemRequest> items;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class IngredientConsumption {
        private Long ingredientId;
        private String code;
        private String name;
        private Double consumedQuantity;
        private Double initialStock;
        private Double remainingStock;
        private String unit;
        private Boolean isDeficient;
        private Double deficientQuantity;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SimulationResultResponse {
        private Boolean isFeasible; // Kho có đủ phục vụ lượng yêu cầu không
        private Integer totalRequestedServings;
        private List<IngredientConsumption> consumptions;
        private List<String> errorMessages;
        private List<DishCapacityInfo> remainingDishCapacities; // Khả năng làm các món sau khi trừ số lượng đã mô phỏng
    }
}
