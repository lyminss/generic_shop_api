package com.example.generic_shop.service;

import com.example.generic_shop.dto.PosOrderRequest;
import com.example.generic_shop.entity.*;
import com.example.generic_shop.enums.ItemPreparedStatus;
import com.example.generic_shop.enums.OrderStatus;
import com.example.generic_shop.repository.*;
import com.example.generic_shop.service.Impl.OrderServiceImpl;
import com.example.generic_shop.service.Impl.VoucherServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OrderAndVoucherBugFixTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private CartService cartService;

    @Mock
    private RecipeItemRepository recipeItemRepository;

    @Mock
    private IngredientRepository ingredientRepository;

    @Mock
    private InventoryTransactionRepository inventoryTransactionRepository;

    @Mock
    private OrderItemRepository orderItemRepository;

    @Mock
    private VoucherService voucherService;

    @Mock
    private VoucherRepository voucherRepository;

    @InjectMocks
    private OrderServiceImpl orderService;

    @InjectMocks
    private VoucherServiceImpl voucherServiceImpl;

    private User staffUser;

    @BeforeEach
    void setUp() {
        staffUser = new User();
        staffUser.setId(1L);
        staffUser.setEmail("staff@example.com");
    }

    private void mockSecurityUser(String email) {
        Authentication auth = mock(Authentication.class);
        when(auth.getName()).thenReturn(email);
        SecurityContext secCtx = mock(SecurityContext.class);
        when(secCtx.getAuthentication()).thenReturn(auth);
        SecurityContextHolder.setContext(secCtx);
    }

    // =========================================================================
    // TESTCASE 1: HỦY ĐƠN HÀNG PHẢI HOÀN LẠI LƯỢT SỬ DỤNG VOUCHER (DECREMENT)
    // =========================================================================
    @Test
    @DisplayName("TC-01: Hủy đơn hàng có dùng voucher -> Phải gọi voucherService.decrementVoucherUsage")
    void testCancelOrder_ShouldDecrementVoucherUsage() {
        Order order = new Order();
        order.setId(100L);
        order.setOrderStatus(OrderStatus.NEW);
        order.setVoucherCode("SALE50K");
        order.setItems(Collections.emptyList());

        when(orderRepository.findById(100L)).thenReturn(Optional.of(order));
        when(orderRepository.save(any(Order.class))).thenReturn(order);

        ResponseEntity<?> response = orderService.updateOrderStatus(100L, OrderStatus.CANCEL);

        assertEquals(200, response.getStatusCode().value());
        assertEquals(OrderStatus.CANCEL, order.getOrderStatus());
        // Verify voucher usage was refunded
        verify(voucherService, times(1)).decrementVoucherUsage("SALE50K");
    }

    // =========================================================================
    // TESTCASE 2: VOUCHER SERVICE - TĂNG VÀ GIẢM SỐ LƯỢT SỬ DỤNG
    // =========================================================================
    @Test
    @DisplayName("TC-02: VoucherService increment và decrement usedCount chuẩn xác")
    void testVoucherUsageTracking() {
        Voucher v = new Voucher();
        v.setCode("GIAM10K");
        v.setUsedCount(2);

        when(voucherRepository.findByCodeIgnoreCase("GIAM10K")).thenReturn(Optional.of(v));
        when(voucherRepository.save(any(Voucher.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Tăng
        voucherServiceImpl.incrementVoucherUsage("GIAM10K");
        assertEquals(3, v.getUsedCount());

        // Giảm (hoàn khi hủy đơn)
        voucherServiceImpl.decrementVoucherUsage("GIAM10K");
        assertEquals(2, v.getUsedCount());
    }

    // =========================================================================
    // TESTCASE 3: TẠO ĐƠN POS VỚI PHƯƠNG THỨC THANH TOÁN QR_TRANSFER
    // =========================================================================
    @Test
    @DisplayName("TC-03: Tạo đơn POS với QR_TRANSFER -> paymentMethod phải được bảo toàn")
    void testCreatePosOrder_PreservesPaymentMethod() {
        mockSecurityUser("staff@example.com");
        when(userRepository.findByEmail("staff@example.com")).thenReturn(Optional.of(staffUser));

        Product product = new Product();
        product.setId(10L);
        product.setName("Trà Sữa Trân Châu");
        product.setPrice(35000);
        product.setStockQuantity(50);

        when(productRepository.findById(10L)).thenReturn(Optional.of(product));
        when(recipeItemRepository.findByProductId(10L)).thenReturn(Collections.emptyList());
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));

        PosOrderRequest req = new PosOrderRequest();
        req.setCustomerName("Anh Tuấn");
        req.setPaymentMethod("QR_TRANSFER");
        PosOrderRequest.PosOrderItemDTO item = new PosOrderRequest.PosOrderItemDTO();
        item.setProductId(10L);
        item.setQuantity(2);
        req.setItems(List.of(item));

        ResponseEntity<?> response = orderService.createPosOrder(req);

        assertEquals(200, response.getStatusCode().value());
        verify(orderRepository).save(argThat(savedOrder ->
                "QR_TRANSFER".equals(savedOrder.getPaymentMethod()) &&
                savedOrder.getTotalPrice() == 70000
        ));
    }

    // =========================================================================
    // TESTCASE 4: TẠO ĐƠN POS VỚI PRODUCT ID KHÔNG TỒN TẠI -> BÁO LỖI RÕ RÀNG
    // =========================================================================
    @Test
    @DisplayName("TC-04: Tạo đơn POS với Product ID không tồn tại -> Báo lỗi rõ ràng, không 500 crash")
    void testCreatePosOrder_NonExistentProduct_ThrowsException() {
        mockSecurityUser("staff@example.com");
        when(userRepository.findByEmail("staff@example.com")).thenReturn(Optional.of(staffUser));

        when(productRepository.findById(999L)).thenReturn(Optional.empty());

        PosOrderRequest req = new PosOrderRequest();
        PosOrderRequest.PosOrderItemDTO item = new PosOrderRequest.PosOrderItemDTO();
        item.setProductId(999L);
        item.setQuantity(1);
        req.setItems(List.of(item));

        RuntimeException ex = assertThrows(RuntimeException.class, () -> orderService.createPosOrder(req));
        assertTrue(ex.getMessage().contains("Món không tồn tại ID: 999"));
    }
}
