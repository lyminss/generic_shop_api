package com.example.generic_shop.service;

import com.example.generic_shop.dto.AddressDTO;
import org.springframework.http.ResponseEntity;

public interface AddressService {
    ResponseEntity<?> getMyAddresses();
    ResponseEntity<?> addAddress(AddressDTO dto);
    ResponseEntity<?> updateAddress(Long id, AddressDTO dto);
    ResponseEntity<?> deleteAddress(Long id);
    ResponseEntity<?> setDefaultAddress(Long id);
}
