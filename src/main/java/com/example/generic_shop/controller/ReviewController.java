package com.example.generic_shop.controller;

import com.example.generic_shop.service.ReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/reviews")
public class ReviewController {

    private final ReviewService reviewService;

    /**
     * Lấy danh sách đánh giá và thống kê của 1 sản phẩm (public)
     */
    @GetMapping("/product/{productId}")
    public ResponseEntity<?> getReviews(@PathVariable Long productId) {
        return reviewService.getReviewsByProductId(productId);
    }

    /**
     * Gửi đánh giá cho sản phẩm (yêu cầu đã đăng nhập + đã mua)
     */
    @PostMapping("/product/{productId}")
    public ResponseEntity<?> createReview(
            @PathVariable Long productId,
            @RequestBody Map<String, Object> body) {
        int rating = Integer.parseInt(body.get("rating").toString());
        String comment = body.get("comment") != null ? body.get("comment").toString() : "";
        return reviewService.createReview(productId, rating, comment);
    }

    /**
     * Kiểm tra người dùng có thể đánh giá sản phẩm này không
     */
    @GetMapping("/product/{productId}/can-review")
    public ResponseEntity<?> canReview(@PathVariable Long productId) {
        return reviewService.canReview(productId);
    }
}
