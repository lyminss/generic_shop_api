package com.example.generic_shop.dto;

import lombok.Data;

import java.util.List;

@Data
public class ProductReviewSummaryDTO {
    private Double avgRating;
    private Long totalReviews;
    private List<ReviewDTO> reviews;
}
