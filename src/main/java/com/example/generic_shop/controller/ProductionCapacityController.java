package com.example.generic_shop.controller;

import com.example.generic_shop.dto.CapacityDTOs;
import com.example.generic_shop.service.ProductionCapacityService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/inventory/capacity")
@RequiredArgsConstructor
public class ProductionCapacityController {

    private final ProductionCapacityService productionCapacityService;

    @GetMapping
    public ResponseEntity<CapacityDTOs.CapacityOverviewResponse> getCapacityOverview() {
        return ResponseEntity.ok(productionCapacityService.calculateCapacityOverview());
    }

    @PostMapping("/simulate")
    public ResponseEntity<?> simulateProduction(@RequestBody CapacityDTOs.SimulationRequest request) {
        try {
            return ResponseEntity.ok(productionCapacityService.simulateProduction(request));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
