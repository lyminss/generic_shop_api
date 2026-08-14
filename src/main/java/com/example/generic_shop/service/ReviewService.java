package com.example.generic_shop.service;

import com.example.generic_shop.dto.ProductReviewSummaryDTO;
import org.springframework.http.ResponseEntity;

public interface ReviewService {
    ResponseEntity<?> getReviewsByProductId(Long productId);
    ResponseEntity<?> createReview(Long productId, int rating, String comment);
    ResponseEntity<?> canReview(Long productId);
}
