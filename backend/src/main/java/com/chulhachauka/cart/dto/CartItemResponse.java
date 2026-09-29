package com.chulhachauka.cart.dto;

import com.chulhachauka.cart.CartItem;

public record CartItemResponse(
    Long menuItemId,
    String name,
    String description,
    long price,
    long pricePaise,
    String imageUrl,
    int quantity,
    long lineTotal
) {
    public static CartItemResponse from(CartItem ci) {
        if (ci == null || ci.getMenuItem() == null) return null;
        var m = ci.getMenuItem();
        long priceRupees = m.getPricePaise() / 100;
        return new CartItemResponse(
            m.getId(),
            m.getName(),
            m.getDescription(),
            priceRupees,
            m.getPricePaise(),
            m.getImageUrl(),
            ci.getQuantity(),
            priceRupees * ci.getQuantity()
        );
    }
}
