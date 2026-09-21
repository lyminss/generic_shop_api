package com.example.generic_shop.controller;

import com.example.generic_shop.dto.VoucherDTO;
import com.example.generic_shop.service.VoucherService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/vouchers")
@RequiredArgsConstructor
public class VoucherController {

    private final VoucherService voucherService;

    /** Admin: Lấy tất cả voucher */
    @GetMapping
    public ResponseEntity<?> getAll() {
        return voucherService.getAllVouchers();
    }

    /** Khách hàng/Công khai: Lấy danh sách voucher đang hoạt động */
    @GetMapping("/public")
    public ResponseEntity<?> getPublic() {
        return voucherService.getPublicVouchers();
    }

    /** Admin: Tạo voucher mới */
    @PostMapping
    public ResponseEntity<?> create(@RequestBody VoucherDTO dto) {
        return voucherService.createVoucher(dto);
    }

    /**
     * User/Staff: Validate mã và tính giảm giá
     * GET /api/vouchers/validate?code=SALE10&orderTotal=150000
     */
    @GetMapping("/validate")
    public ResponseEntity<?> validate(
            @RequestParam String code,
            @RequestParam(required = false, defaultValue = "0") Double orderTotal) {
        return voucherService.validateVoucher(code, orderTotal);
    }

    /** Admin: Bật/tắt voucher */
    @PatchMapping("/{id}/toggle")
    public ResponseEntity<?> toggle(@PathVariable Long id) {
        return voucherService.toggleVoucher(id);
    }

    /** Admin: Xóa voucher */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        return voucherService.deleteVoucher(id);
    }
}
