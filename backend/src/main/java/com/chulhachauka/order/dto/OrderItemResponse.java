package com.chulhachauka.order.dto;

import com.chulhachauka.order.OrderItem;

public record OrderItemResponse(
    Long menuItemId,
    String name,
    long price,
    long pricePaise,
    int quantity,
    long lineTotal
) {
    public static OrderItemResponse from(OrderItem oi) {
        if (oi == null) return null;
        Long menuItemId = oi.getMenuItem() != null ? oi.getMenuItem().getId() : null;
        long priceRupees = oi.getPriceSnapshot() / 100;
        return new OrderItemResponse(
            menuItemId,
            oi.getNameSnapshot(),
            priceRupees,
            oi.getPriceSnapshot(),
            oi.getQuantity(),
            priceRupees * oi.getQuantity()
        );
    }
}
