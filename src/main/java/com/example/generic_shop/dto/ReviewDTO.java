package com.example.generic_shop.dto;

import lombok.Data;

import java.util.Date;
import java.util.List;

@Data
public class ReviewDTO {
    private Long id;
    private Long userId;
    private String userName;
    private Long productId;
    private int rating;
    private String comment;
    private Date createdAt;
}
