package com.example.generic_shop.service;

import com.example.generic_shop.dto.CapacityDTOs;
import com.example.generic_shop.dto.CategoryDTOs;
import com.example.generic_shop.entity.Category;
import com.example.generic_shop.entity.Ingredient;
import com.example.generic_shop.entity.Product;
import com.example.generic_shop.entity.RecipeItem;
import com.example.generic_shop.repository.CategoryRepository;
import com.example.generic_shop.repository.IngredientRepository;
import com.example.generic_shop.repository.ProductRepository;
import com.example.generic_shop.repository.RecipeItemRepository;
import com.example.generic_shop.service.Impl.CategoryServiceImpl;
import com.example.generic_shop.service.Impl.ProductionCapacityServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CategoryAndCapacityServiceTest {

    @Mock
    private CategoryRepository categoryRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private IngredientRepository ingredientRepository;

    @Mock
    private RecipeItemRepository recipeItemRepository;

    @InjectMocks
    private CategoryServiceImpl categoryService;

    @InjectMocks
    private ProductionCapacityServiceImpl capacityService;

    private Category category;
    private Product product1;
    private Product product2;

    @BeforeEach
    void setUp() {
        category = new Category();
        category.setId(1L);
        category.setName("Cà Phê");
        category.setActive(true);

        product1 = new Product();
        product1.setId(10L);
        product1.setName("Cà Phê Sữa Đá");
        product1.setCategory("Cà Phê");
        product1.setStatus("ACTIVE");
        product1.setStockQuantity(100);

        product2 = new Product();
        product2.setId(11L);
        product2.setName("Cà Phê Đen");
        product2.setCategory("Cà Phê");
        product2.setStatus("ACTIVE");
        product2.setStockQuantity(100);
    }

    @Test
    @DisplayName("Khi ẩn danh mục, toàn bộ món ăn thuộc danh mục tự động chuyển trạng thái sang STOPPED")
    void testHideCategoryCascadesStopProducts() {
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(category));
        when(categoryRepository.save(any(Category.class))).thenReturn(category);
        when(productRepository.findByCategoryIgnoreCase("Cà Phê")).thenReturn(Arrays.asList(product1, product2));

        CategoryDTOs.StatusToggleResponse response = categoryService.setCategoryActive(1L, false);

        assertFalse(category.getActive());
        assertEquals(2, response.getAffectedProductsCount());
        assertEquals("STOPPED", product1.getStatus());
        assertEquals("STOPPED", product2.getStatus());
        assertTrue(response.getMessage().contains("Ngừng bán"));

        verify(productRepository, times(1)).saveAll(any());
    }

    @Test
    @DisplayName("Khi hiển thị lại danh mục, các món ăn thuộc danh mục tự động chuyển sang ACTIVE")
    void testShowCategoryCascadesActiveProducts() {
        category.setActive(false);
        product1.setStatus("STOPPED");
        product2.setStatus("STOPPED");

        when(categoryRepository.findById(1L)).thenReturn(Optional.of(category));
        when(categoryRepository.save(any(Category.class))).thenReturn(category);
        when(productRepository.findByCategoryIgnoreCase("Cà Phê")).thenReturn(Arrays.asList(product1, product2));

        CategoryDTOs.StatusToggleResponse response = categoryService.setCategoryActive(1L, true);

        assertTrue(category.getActive());
        assertEquals(2, response.getAffectedProductsCount());
        assertEquals("ACTIVE", product1.getStatus());
        assertEquals("ACTIVE", product2.getStatus());
        assertTrue(response.getMessage().contains("kích hoạt lại"));

        verify(productRepository, times(1)).saveAll(any());
    }

    @Test
    @DisplayName("Thuật toán tính số món ăn từ kho: Tính đúng số ly tối đa và xác định đúng nguyên liệu điểm nghẽn")
    void testCalculateCapacityOverview() {
        // Cà phê bột: 100g (0.1kg), cần 20g/ly -> tối đa 5 ly
        Ingredient coffee = new Ingredient();
        coffee.setId(1L);
        coffee.setCode("NL01");
        coffee.setName("Cà phê Arabica");
        coffee.setUnit("kg");
        coffee.setCurrentStock(0.1); // 100g
        coffee.setExpiryDate(LocalDate.now().plusDays(30));

        // Sữa đặc: 1000ml (1 chai), cần 50ml/ly -> tối đa 20 ly
        Ingredient milk = new Ingredient();
        milk.setId(2L);
        milk.setCode("NL02");
        milk.setName("Sữa đặc");
        milk.setUnit("chai");
        milk.setCurrentStock(1.0); // 1000ml
        milk.setExpiryDate(LocalDate.now().plusDays(30));

        RecipeItem ri1 = new RecipeItem(product1, coffee, 20.0, "g");
        RecipeItem ri2 = new RecipeItem(product1, milk, 50.0, "ml");

        when(productRepository.findAll()).thenReturn(Collections.singletonList(product1));
        when(ingredientRepository.findAll()).thenReturn(Arrays.asList(coffee, milk));
        when(recipeItemRepository.findAll()).thenReturn(Arrays.asList(ri1, ri2));

        CapacityDTOs.CapacityOverviewResponse overview = capacityService.calculateCapacityOverview();

        assertNotNull(overview);
        assertEquals(1, overview.getTotalProducts());
        assertEquals(1, overview.getReadyToServeProducts());
        assertEquals(0, overview.getOutOfStockProducts());

        CapacityDTOs.DishCapacityInfo dishInfo = overview.getDishCapacities().get(0);
        assertEquals(5, dishInfo.getMaxPossibleServings()); // Bị giới hạn bởi cà phê (5 ly)
        assertEquals("Cà phê Arabica", dishInfo.getLimitingIngredientName());
        assertEquals("AVAILABLE", dishInfo.getStatusTag());
    }

    @Test
    @DisplayName("Thuật toán tính số món ăn: Nhận diện nguyên liệu hết hạn và trả về 0 ly")
    void testCalculateCapacityWithExpiredIngredient() {
        Ingredient expiredTea = new Ingredient();
        expiredTea.setId(3L);
        expiredTea.setCode("NL03");
        expiredTea.setName("Trà xanh quá hạn");
        expiredTea.setUnit("kg");
        expiredTea.setCurrentStock(5.0);
        expiredTea.setExpiryDate(LocalDate.now().minusDays(2)); // Quá hạn 2 ngày

        RecipeItem ri = new RecipeItem(product2, expiredTea, 10.0, "g");

        when(productRepository.findAll()).thenReturn(Collections.singletonList(product2));
        when(ingredientRepository.findAll()).thenReturn(Collections.singletonList(expiredTea));
        when(recipeItemRepository.findAll()).thenReturn(Collections.singletonList(ri));

        CapacityDTOs.CapacityOverviewResponse overview = capacityService.calculateCapacityOverview();

        assertEquals(1, overview.getOutOfStockProducts());
        CapacityDTOs.DishCapacityInfo dishInfo = overview.getDishCapacities().get(0);
        assertEquals(0, dishInfo.getMaxPossibleServings());
        assertEquals("EXPIRED_INGREDIENT", dishInfo.getStatusTag());
        assertTrue(dishInfo.getStatusDescription().contains("hết hạn"));
    }
}
