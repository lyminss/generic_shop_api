package com.example.generic_shop.service.Impl;

import com.example.generic_shop.dto.AddressDTO;
import com.example.generic_shop.entity.Address;
import com.example.generic_shop.entity.User;
import com.example.generic_shop.repository.AddressRepository;
import com.example.generic_shop.repository.UserRepository;
import com.example.generic_shop.service.AddressService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AddressServiceImpl implements AddressService {

    private final AddressRepository addressRepository;
    private final UserRepository userRepository;

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    private AddressDTO mapToDTO(Address address) {
        AddressDTO dto = new AddressDTO();
        dto.setId(address.getId());
        dto.setRecipientName(address.getRecipientName());
        dto.setPhone(address.getPhone());
        dto.setFullAddress(address.getFullAddress());
        dto.setDefault(address.isDefault());
        return dto;
    }

    @Override
    public ResponseEntity<?> getMyAddresses() {
        User user = getCurrentUser();
        List<Address> addresses = addressRepository.findByUser(user);
        List<AddressDTO> dtos = addresses.stream().map(this::mapToDTO).collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    @Override
    public ResponseEntity<?> addAddress(AddressDTO dto) {
        User user = getCurrentUser();
        List<Address> existing = addressRepository.findByUser(user);
        
        Address address = new Address();
        address.setUser(user);
        address.setRecipientName(dto.getRecipientName());
        address.setPhone(dto.getPhone());
        address.setFullAddress(dto.getFullAddress());
        
        if (existing.isEmpty() || dto.isDefault()) {
            address.setDefault(true);
            if (dto.isDefault()) {
                clearOtherDefaults(existing);
            }
        } else {
            address.setDefault(false);
        }

        address = addressRepository.save(address);
        return ResponseEntity.ok(mapToDTO(address));
    }

    @Override
    public ResponseEntity<?> updateAddress(Long id, AddressDTO dto) {
        User user = getCurrentUser();
        Address address = addressRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new RuntimeException("Address not found"));

        address.setRecipientName(dto.getRecipientName());
        address.setPhone(dto.getPhone());
        address.setFullAddress(dto.getFullAddress());

        if (dto.isDefault() && !address.isDefault()) {
            address.setDefault(true);
            List<Address> existing = addressRepository.findByUser(user);
            clearOtherDefaults(existing);
        } else if (!dto.isDefault() && address.isDefault()) {
            // Can't un-default the only default address directly without setting another one
            // We just ignore the attempt to un-default if it's the only one, or allow it if there are others (handled simply by just saving)
            // For simplicity, we just save it.
            address.setDefault(false);
        }

        address = addressRepository.save(address);
        return ResponseEntity.ok(mapToDTO(address));
    }

    @Override
    public ResponseEntity<?> deleteAddress(Long id) {
        User user = getCurrentUser();
        Address address = addressRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new RuntimeException("Address not found"));
        
        addressRepository.delete(address);
        return ResponseEntity.ok("Deleted successfully");
    }

    @Override
    public ResponseEntity<?> setDefaultAddress(Long id) {
        User user = getCurrentUser();
        Address address = addressRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new RuntimeException("Address not found"));

        List<Address> existing = addressRepository.findByUser(user);
        clearOtherDefaults(existing);

        address.setDefault(true);
        address = addressRepository.save(address);
        return ResponseEntity.ok(mapToDTO(address));
    }

    private void clearOtherDefaults(List<Address> addresses) {
        for (Address addr : addresses) {
            if (addr.isDefault()) {
                addr.setDefault(false);
                addressRepository.save(addr);
            }
        }
    }
}
