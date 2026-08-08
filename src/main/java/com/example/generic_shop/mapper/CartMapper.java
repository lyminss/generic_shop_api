package com.example.generic_shop.mapper;

import com.example.generic_shop.dto.CartDTO;
import com.example.generic_shop.dto.CartItemDTO;
import com.example.generic_shop.entity.Cart;
import com.example.generic_shop.entity.CartItem;

import java.util.List;
import java.util.stream.Collectors;

public class CartMapper {

    public static CartDTO toDTO(Cart cart){
        CartDTO dto = new CartDTO();
        dto.setId(cart.getId());
        dto.setCustomerId(cart.getCustomer().getId());

        List<CartItemDTO> itemDTOs = cart.getItems() == null ? List.of() :
                cart.getItems().stream()
                .map(CartMapper::toItemDTO)
                .collect(Collectors.toList());

        dto.setItems(itemDTOs);
        return dto;
    }

    private static CartItemDTO toItemDTO(CartItem item){
        CartItemDTO dto = new CartItemDTO();
        dto.setId(item.getId());
        dto.setProductId(item.getProduct().getId());
        dto.setProductName(item.getProduct().getName()); // tùy field thực tế trong Product
// trong CartMapper.toItemDTO
        dto.setPrice(item.getProduct().getPrice());
        dto.setQuantity(item.getQuantity());
        return dto;
    }
}