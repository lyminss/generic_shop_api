package com.example.generic_shop.service;

import com.example.generic_shop.dto.StockReceiptDTOs;
import com.example.generic_shop.entity.StockReceipt;

import java.util.List;

public interface StockReceiptService {
    StockReceipt createStockReceipt(StockReceiptDTOs.CreateStockReceiptRequest request);
    List<StockReceipt> getAllStockReceipts();
    StockReceipt getStockReceiptById(Long id);
}
