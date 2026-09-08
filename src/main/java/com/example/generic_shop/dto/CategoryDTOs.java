package com.example.generic_shop.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.Date;

public class CategoryDTOs {

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CategoryResponse {
        private Long id;
        private String name;
        private String description;
        private String image;
        private Boolean active;
        private Integer displayOrder;
        private Integer productCount;
        private Date createdAt;
        private Date updatedAt;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CategoryRequest {
        private String name;
        private String description;
        private String image;
        private Boolean active;
        private Integer displayOrder;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StatusToggleResponse {
        private Long id;
        private String name;
        private Boolean active;
        private int affectedProductsCount;
        private String message;
    }
}
