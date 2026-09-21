package com.example.generic_shop.service;

import com.example.generic_shop.dto.VoucherDTO;
import org.springframework.http.ResponseEntity;

public interface VoucherService {
    ResponseEntity<?> getAllVouchers();
    ResponseEntity<?> getPublicVouchers();
    ResponseEntity<?> createVoucher(VoucherDTO dto);
    ResponseEntity<?> validateVoucher(String code, Double orderTotal);
    ResponseEntity<?> toggleVoucher(Long id);
    ResponseEntity<?> deleteVoucher(Long id);
    double calculateDiscount(String code, double orderTotal);
}
