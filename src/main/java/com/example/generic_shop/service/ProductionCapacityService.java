package com.example.generic_shop.service;

import com.example.generic_shop.dto.CapacityDTOs;

public interface ProductionCapacityService {

    /**
     * Thuật toán phân tích khả năng phục vụ toàn diện từ kho nguyên liệu:
     * 1. Số phần tối đa độc lập của từng món & Nguyên liệu điểm nghẽn
     * 2. Phân bổ công suất đồng thời tối đa toàn quán khi dùng chung nguyên liệu
     * 3. Danh sách nguyên liệu nghẽn hàng đầu
     */
    CapacityDTOs.CapacityOverviewResponse calculateCapacityOverview();

    /**
     * Thuật toán mô phỏng sản xuất / pha chế theo ca:
     * Kiểm tra tính khả thi, lượng nguyên liệu tiêu hao, lượng thiếu hụt,
     * và số ly còn lại của các món khác sau khi thực hiện đơn hàng mô phỏng.
     */
    CapacityDTOs.SimulationResultResponse simulateProduction(CapacityDTOs.SimulationRequest request);
}
