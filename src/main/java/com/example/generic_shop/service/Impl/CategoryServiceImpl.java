package com.example.generic_shop.service.Impl;

import com.example.generic_shop.dto.CategoryDTOs;
import com.example.generic_shop.entity.Category;
import com.example.generic_shop.entity.Product;
import com.example.generic_shop.repository.CategoryRepository;
import com.example.generic_shop.repository.ProductRepository;
import com.example.generic_shop.service.CategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CategoryServiceImpl implements CategoryService {

    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;

    @Override
    public List<CategoryDTOs.CategoryResponse> getAllCategories() {
        List<Category> categories = categoryRepository.findAllByOrderByDisplayOrderAscIdAsc();
        Map<String, Long> countMap = countProductsByCategory();

        return categories.stream()
                .map(c -> toResponse(c, countMap.getOrDefault(c.getName().toLowerCase(), 0L).intValue()))
                .collect(Collectors.toList());
    }

    @Override
    public List<CategoryDTOs.CategoryResponse> getActiveCategories() {
        List<Category> categories = categoryRepository.findByActiveTrueOrderByDisplayOrderAscIdAsc();
        Map<String, Long> countMap = countProductsByCategory();

        return categories.stream()
                .map(c -> toResponse(c, countMap.getOrDefault(c.getName().toLowerCase(), 0L).intValue()))
                .collect(Collectors.toList());
    }

    @Override
    public Category getById(Long id) {
        return categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy danh mục với ID: " + id));
    }

    @Override
    public CategoryDTOs.CategoryResponse createCategory(CategoryDTOs.CategoryRequest request) {
        if (request.getName() == null || request.getName().trim().isEmpty()) {
            throw new RuntimeException("Tên danh mục không được để trống");
        }

        String name = request.getName().trim();
        if (categoryRepository.existsByNameIgnoreCase(name)) {
            throw new RuntimeException("Danh mục '" + name + "' đã tồn tại");
        }

        Category category = new Category();
        category.setName(name);
        category.setDescription(request.getDescription());
        category.setImage(request.getImage());
        category.setActive(request.getActive() != null ? request.getActive() : true);
        category.setDisplayOrder(request.getDisplayOrder() != null ? request.getDisplayOrder() : 0);

        Category saved = categoryRepository.save(category);
        return toResponse(saved, 0);
    }

    @Transactional
    @Override
    public CategoryDTOs.CategoryResponse updateCategory(Long id, CategoryDTOs.CategoryRequest request) {
        Category category = getById(id);

        if (request.getName() == null || request.getName().trim().isEmpty()) {
            throw new RuntimeException("Tên danh mục không được để trống");
        }

        String newName = request.getName().trim();
        String oldName = category.getName();

        if (!oldName.equalsIgnoreCase(newName) && categoryRepository.existsByNameIgnoreCase(newName)) {
            throw new RuntimeException("Danh mục với tên '" + newName + "' đã tồn tại");
        }

        // Cập nhật tên trong các sản phẩm liên quan nếu đổi tên danh mục
        if (!oldName.equalsIgnoreCase(newName)) {
            List<Product> products = productRepository.findByCategoryIgnoreCase(oldName);
            for (Product p : products) {
                p.setCategory(newName);
            }
            productRepository.saveAll(products);
        }

        category.setName(newName);
        category.setDescription(request.getDescription());
        category.setImage(request.getImage());
        if (request.getDisplayOrder() != null) {
            category.setDisplayOrder(request.getDisplayOrder());
        }

        // Nếu có thay đổi trạng thái active
        if (request.getActive() != null && !request.getActive().equals(category.getActive())) {
            setCategoryActive(id, request.getActive());
        } else {
            categoryRepository.save(category);
        }

        int count = productRepository.findByCategoryIgnoreCase(newName).size();
        return toResponse(category, count);
    }

    @Transactional
    @Override
    public CategoryDTOs.StatusToggleResponse setCategoryActive(Long id, boolean active) {
        Category category = getById(id);
        category.setActive(active);
        categoryRepository.save(category);

        List<Product> products = productRepository.findByCategoryIgnoreCase(category.getName());
        int affectedCount = products.size();

        String message;
        if (!active) {
            // Khi ẩn danh mục: Chuyển toàn bộ món thuộc danh mục về STOPPED (ngừng bán)
            for (Product p : products) {
                p.setStatus("STOPPED");
            }
            productRepository.saveAll(products);
            message = "Đã ẩn danh mục '" + category.getName() + "' và chuyển " + affectedCount + " món ăn sang trạng thái 'Ngừng bán'";
        } else {
            // Khi hiện danh mục: Kích hoạt lại các món ăn sang trạng thái ACTIVE (đang bán)
            for (Product p : products) {
                p.setStatus("ACTIVE");
            }
            productRepository.saveAll(products);
            message = "Đã hiển thị danh mục '" + category.getName() + "' và kích hoạt lại " + affectedCount + " món ăn mở bán";
        }

        return new CategoryDTOs.StatusToggleResponse(
                category.getId(),
                category.getName(),
                category.getActive(),
                affectedCount,
                message
        );
    }

    @Transactional
    @Override
    public CategoryDTOs.StatusToggleResponse toggleCategoryActive(Long id) {
        Category category = getById(id);
        boolean newStatus = !Boolean.TRUE.equals(category.getActive());
        return setCategoryActive(id, newStatus);
    }

    @Transactional
    @Override
    public void deleteCategory(Long id) {
        Category category = getById(id);
        List<Product> products = productRepository.findByCategoryIgnoreCase(category.getName());
        if (!products.isEmpty()) {
            throw new RuntimeException("Không thể xóa danh mục '" + category.getName() + "' vì đang có " + products.size() + " món ăn trực thuộc. Vui lòng chuyển danh mục hoặc xóa các món ăn trước!");
        }
        categoryRepository.delete(category);
    }

    private Map<String, Long> countProductsByCategory() {
        return productRepository.findAll().stream()
                .filter(p -> p.getCategory() != null && !p.getCategory().isBlank())
                .collect(Collectors.groupingBy(
                        p -> p.getCategory().trim().toLowerCase(),
                        Collectors.counting()
                ));
    }

    private CategoryDTOs.CategoryResponse toResponse(Category c, int productCount) {
        return new CategoryDTOs.CategoryResponse(
                c.getId(),
                c.getName(),
                c.getDescription(),
                c.getImage(),
                c.getActive(),
                c.getDisplayOrder(),
                productCount,
                c.getCreatedAt(),
                c.getUpdatedAt()
        );
    }
}
