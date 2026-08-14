package com.example.generic_shop.service.Impl;

import com.example.generic_shop.dto.ProductReviewSummaryDTO;
import com.example.generic_shop.dto.ReviewDTO;
import com.example.generic_shop.entity.Product;
import com.example.generic_shop.entity.Review;
import com.example.generic_shop.entity.User;
import com.example.generic_shop.enums.OrderStatus;
import com.example.generic_shop.repository.OrderRepository;
import com.example.generic_shop.repository.ProductRepository;
import com.example.generic_shop.repository.ReviewRepository;
import com.example.generic_shop.repository.UserRepository;
import com.example.generic_shop.service.ReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ReviewServiceImpl implements ReviewService {

    private final ReviewRepository reviewRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final OrderRepository orderRepository;

    @Override
    public ResponseEntity<?> getReviewsByProductId(Long productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Sản phẩm không tồn tại"));

        List<ReviewDTO> reviews = reviewRepository.findByProductOrderByCreatedAtDesc(product)
                .stream().map(this::toDTO).toList();

        Double avg = reviewRepository.findAvgRatingByProductId(productId);
        Long count = reviewRepository.countByProductId(productId);

        ProductReviewSummaryDTO summary = new ProductReviewSummaryDTO();
        summary.setAvgRating(avg != null ? Math.round(avg * 10.0) / 10.0 : 0.0);
        summary.setTotalReviews(count != null ? count : 0L);
        summary.setReviews(reviews);

        return ResponseEntity.ok(summary);
    }

    @Override
    public ResponseEntity<?> createReview(Long productId, int rating, String comment) {
        // Validate rating
        if (rating < 1 || rating > 5) {
            return ResponseEntity.badRequest().body("Điểm đánh giá phải từ 1 đến 5");
        }

        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Người dùng không tồn tại"));

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Sản phẩm không tồn tại"));

        // Kiểm tra đã mua và hoàn tất chưa
        boolean hasPurchased = orderRepository.existsByCustomerAndItemsProductAndOrderStatus(
                user, product, OrderStatus.COMPLETED);
        if (!hasPurchased) {
            return ResponseEntity.status(403)
                    .body("Bạn cần mua và hoàn tất đơn hàng sản phẩm này trước khi đánh giá");
        }

        // Kiểm tra đã review chưa
        if (reviewRepository.existsByUserAndProduct(user, product)) {
            return ResponseEntity.status(409)
                    .body("Bạn đã đánh giá sản phẩm này rồi");
        }

        Review review = new Review();
        review.setUser(user);
        review.setProduct(product);
        review.setRating(rating);
        review.setComment(comment != null ? comment.trim() : "");

        reviewRepository.save(review);
        return ResponseEntity.status(201).body(toDTO(review));
    }

    @Override
    public ResponseEntity<?> canReview(Long productId) {
        String email;
        try {
            email = SecurityContextHolder.getContext().getAuthentication().getName();
        } catch (Exception e) {
            return ResponseEntity.ok(Map.of("canReview", false, "reason", "not_authenticated"));
        }

        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            return ResponseEntity.ok(Map.of("canReview", false, "reason", "not_authenticated"));
        }
        User user = userOpt.get();

        Product product = productRepository.findById(productId)
                .orElse(null);
        if (product == null) {
            return ResponseEntity.ok(Map.of("canReview", false, "reason", "product_not_found"));
        }

        if (reviewRepository.existsByUserAndProduct(user, product)) {
            return ResponseEntity.ok(Map.of("canReview", false, "reason", "already_reviewed"));
        }

        boolean hasPurchased = orderRepository.existsByCustomerAndItemsProductAndOrderStatus(
                user, product, OrderStatus.COMPLETED);
        if (!hasPurchased) {
            return ResponseEntity.ok(Map.of("canReview", false, "reason", "not_purchased"));
        }

        return ResponseEntity.ok(Map.of("canReview", true, "reason", "eligible"));
    }

    // =========== Mapper ===========

    private ReviewDTO toDTO(Review review) {
        ReviewDTO dto = new ReviewDTO();
        dto.setId(review.getId());
        dto.setRating(review.getRating());
        dto.setComment(review.getComment());
        dto.setCreatedAt(review.getCreatedAt());
        if (review.getUser() != null) {
            dto.setUserId(review.getUser().getId());
            String name = (review.getUser().getFirstName() != null ? review.getUser().getFirstName() : "")
                    + " " + (review.getUser().getLastName() != null ? review.getUser().getLastName() : "");
            dto.setUserName(name.trim().isEmpty() ? review.getUser().getEmail() : name.trim());
        }
        if (review.getProduct() != null) {
            dto.setProductId(review.getProduct().getId());
        }
        return dto;
    }
}
