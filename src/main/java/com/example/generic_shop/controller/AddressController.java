package com.example.generic_shop.controller;

import com.example.generic_shop.dto.AddressDTO;
import com.example.generic_shop.service.AddressService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/addresses")
@RequiredArgsConstructor
public class AddressController {

    private final AddressService addressService;

    @GetMapping
    public ResponseEntity<?> getMyAddresses() {
        return addressService.getMyAddresses();
    }

    @PostMapping
    public ResponseEntity<?> addAddress(@RequestBody AddressDTO dto) {
        return addressService.addAddress(dto);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateAddress(@PathVariable Long id, @RequestBody AddressDTO dto) {
        return addressService.updateAddress(id, dto);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteAddress(@PathVariable Long id) {
        return addressService.deleteAddress(id);
    }

    @PutMapping("/{id}/default")
    public ResponseEntity<?> setDefaultAddress(@PathVariable Long id) {
        return addressService.setDefaultAddress(id);
    }
}
