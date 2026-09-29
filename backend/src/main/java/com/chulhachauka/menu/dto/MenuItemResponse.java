package com.chulhachauka.menu.dto;

import com.chulhachauka.menu.MenuItem;

public record MenuItemResponse(
    Long id,
    String name,
    String description,
    long price,
    long pricePaise,
    CategoryResponse category,
    String imageUrl,
    boolean isVeg,
    boolean isAvailable,
    boolean isBestseller
) {
    public static MenuItemResponse from(MenuItem m) {
        if (m == null) return null;
        return new MenuItemResponse(
            m.getId(),
            m.getName(),
            m.getDescription(),
            m.getPricePaise() / 100,
            m.getPricePaise(),
            CategoryResponse.from(m.getCategory()),
            m.getImageUrl(),
            m.isVeg(),
            m.isAvailable(),
            m.isBestseller()
        );
    }
}
