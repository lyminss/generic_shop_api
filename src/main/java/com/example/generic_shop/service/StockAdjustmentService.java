package com.example.generic_shop.service;

import com.example.generic_shop.dto.StockAdjustmentDTOs;
import com.example.generic_shop.entity.StockAdjustment;

import java.util.List;

public interface StockAdjustmentService {
    StockAdjustment createStockAdjustment(StockAdjustmentDTOs.CreateStockAdjustmentRequest request);
    List<StockAdjustment> getAllStockAdjustments();
    StockAdjustment getStockAdjustmentById(Long id);
}
