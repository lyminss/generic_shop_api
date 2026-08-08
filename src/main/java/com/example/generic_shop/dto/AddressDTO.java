package com.example.generic_shop.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AddressDTO {
    private Long id;
    private String recipientName;
    private String phone;
    private String fullAddress;
    private boolean isDefault;
}
