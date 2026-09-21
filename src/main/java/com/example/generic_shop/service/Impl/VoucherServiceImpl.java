package com.example.generic_shop.service.Impl;

import com.example.generic_shop.dto.VoucherDTO;
import com.example.generic_shop.entity.Voucher;
import com.example.generic_shop.repository.VoucherRepository;
import com.example.generic_shop.service.VoucherService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class VoucherServiceImpl implements VoucherService {

    private final VoucherRepository voucherRepository;

    @Override
    public ResponseEntity<?> getAllVouchers() {
        List<VoucherDTO> list = voucherRepository.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(list);
    }

    @Override
    public ResponseEntity<?> getPublicVouchers() {
        LocalDate today = LocalDate.now();
        List<VoucherDTO> list = voucherRepository.findAll().stream()
                .filter(v -> Boolean.TRUE.equals(v.getActive()))
                .filter(v -> v.getExpiryDate() == null || !v.getExpiryDate().isBefore(today))
                .filter(v -> v.getMaxUsage() == null || v.getUsedCount() < v.getMaxUsage())
                .map(this::toDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(list);
    }

    @Override
    public ResponseEntity<?> createVoucher(VoucherDTO dto) {
        String code = dto.getCode().trim().toUpperCase();
        if (voucherRepository.existsByCodeIgnoreCase(code)) {
            return ResponseEntity.badRequest().body("Mã voucher '" + code + "' đã tồn tại!");
        }

        Voucher v = new Voucher();
        v.setCode(code);
        v.setDiscountType(dto.getDiscountType());
        v.setDiscountValue(dto.getDiscountValue());
        
        Double minOrder = dto.getMinOrderValue() != null ? dto.getMinOrderValue() : dto.getMinOrderAmount();
        v.setMinOrderValue(minOrder);

        Double maxDisc = dto.getMaxDiscountAmount() != null ? dto.getMaxDiscountAmount() : dto.getMaxDiscount();
        v.setMaxDiscountAmount(maxDisc);

        v.setMaxUsage(dto.getMaxUsage());
        v.setUsedCount(0);
        v.setActive(dto.getActive() != null ? dto.getActive() : true);

        LocalDate exp = dto.getExpiryDate() != null ? dto.getExpiryDate() : dto.getEndDate();
        v.setExpiryDate(exp);

        v.setDescription(dto.getDescription());

        return ResponseEntity.status(201).body(toDTO(voucherRepository.save(v)));
    }

    @Override
    public ResponseEntity<?> validateVoucher(String code, Double orderTotal) {
        Voucher v = voucherRepository.findByCodeIgnoreCase(code != null ? code.trim() : "").orElse(null);
        if (v == null) {
            return ResponseEntity.badRequest().body("Mã voucher không tồn tại.");
        }

        double total = orderTotal != null ? orderTotal : 0.0;
        String error = checkVoucherEligibility(v, total);
        if (error != null) {
            return ResponseEntity.badRequest().body(error);
        }

        double rawDiscount = "PERCENT".equalsIgnoreCase(v.getDiscountType())
                ? total * (v.getDiscountValue() / 100.0)
                : v.getDiscountValue();
        double discount = computeDiscount(v, total);
        boolean appliedCap = "PERCENT".equalsIgnoreCase(v.getDiscountType())
                && v.getMaxDiscountAmount() != null
                && rawDiscount > v.getMaxDiscountAmount();

        VoucherDTO dto = toDTO(v);
        dto.setRawDiscount(rawDiscount);
        dto.setComputedDiscount(discount);
        dto.setAppliedCap(appliedCap);
        dto.setMessage(formatDiscountMessage(v, discount, appliedCap));
        return ResponseEntity.ok(dto);
    }

    @Override
    public ResponseEntity<?> toggleVoucher(Long id) {
        Voucher v = voucherRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Voucher không tồn tại"));
        v.setActive(!v.getActive());
        return ResponseEntity.ok(toDTO(voucherRepository.save(v)));
    }

    @Override
    public ResponseEntity<?> deleteVoucher(Long id) {
        if (!voucherRepository.existsById(id)) {
            return ResponseEntity.status(404).body("Voucher không tồn tại");
        }
        voucherRepository.deleteById(id);
        return ResponseEntity.ok("Đã xóa voucher.");
    }

    @Override
    public double calculateDiscount(String code, double orderTotal) {
        if (code == null || code.isBlank()) return 0.0;
        Voucher v = voucherRepository.findByCodeIgnoreCase(code.trim()).orElse(null);
        if (v == null) return 0.0;
        if (checkVoucherEligibility(v, orderTotal) != null) return 0.0;
        return computeDiscount(v, orderTotal);
    }

    /** Package helper: tìm voucher entity theo code (dùng bởi OrderServiceImpl) */
    public Voucher findVoucherByCode(String code) {
        return voucherRepository.findByCodeIgnoreCase(code.trim()).orElse(null);
    }

    /** Package helper: save voucher entity */
    public Voucher saveVoucher(Voucher v) {
        return voucherRepository.save(v);
    }

    // ─── Helpers ───────────────────────────────────────────────────────────────

    private String checkVoucherEligibility(Voucher v, double orderTotal) {
        if (!Boolean.TRUE.equals(v.getActive())) return "Mã voucher đã bị vô hiệu hóa.";

        if (v.getExpiryDate() != null && v.getExpiryDate().isBefore(LocalDate.now())) {
            return "Mã voucher đã hết hạn (" + v.getExpiryDate() + ").";
        }

        if (v.getMaxUsage() != null && v.getUsedCount() >= v.getMaxUsage()) {
            return "Mã voucher đã đạt giới hạn sử dụng.";
        }

        if (v.getMinOrderValue() != null && orderTotal < v.getMinOrderValue()) {
            return String.format("Đơn tối thiểu %.0f₫ để dùng voucher này.", v.getMinOrderValue());
        }

        return null;
    }

    private double computeDiscount(Voucher v, double orderTotal) {
        double discount;
        if ("PERCENT".equalsIgnoreCase(v.getDiscountType())) {
            discount = orderTotal * (v.getDiscountValue() / 100.0);
            if (v.getMaxDiscountAmount() != null) {
                discount = Math.min(discount, v.getMaxDiscountAmount());
            }
        } else {
            discount = v.getDiscountValue();
        }
        return Math.min(discount, orderTotal);
    }

    private String formatDiscountMessage(Voucher v, double discount, boolean appliedCap) {
        if ("PERCENT".equalsIgnoreCase(v.getDiscountType())) {
            if (appliedCap) {
                return String.format("Voucher hợp lệ! Giảm %.0f%% (đã áp dụng mức giảm tối đa %.0f₫)",
                        v.getDiscountValue(), v.getMaxDiscountAmount());
            } else if (v.getMaxDiscountAmount() != null) {
                return String.format("Voucher hợp lệ! Giảm %.0f%% = -%.0f₫ (tối đa %.0f₫)",
                        v.getDiscountValue(), discount, v.getMaxDiscountAmount());
            } else {
                return String.format("Voucher hợp lệ! Giảm %.0f%% = -%.0f₫",
                        v.getDiscountValue(), discount);
            }
        }
        return String.format("Voucher hợp lệ! Giảm -%.0f₫", discount);
    }

    private VoucherDTO toDTO(Voucher v) {
        VoucherDTO dto = new VoucherDTO();
        dto.setId(v.getId());
        dto.setCode(v.getCode());
        dto.setDiscountType(v.getDiscountType());
        dto.setDiscountValue(v.getDiscountValue());
        dto.setMinOrderValue(v.getMinOrderValue());
        dto.setMaxDiscountAmount(v.getMaxDiscountAmount());
        dto.setMaxUsage(v.getMaxUsage());
        dto.setUsedCount(v.getUsedCount() != null ? v.getUsedCount() : 0);
        dto.setActive(v.getActive());
        dto.setExpiryDate(v.getExpiryDate());
        dto.setDescription(v.getDescription());
        return dto;
    }
}
