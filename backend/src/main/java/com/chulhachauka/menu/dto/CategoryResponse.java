package com.chulhachauka.menu.dto;

import com.chulhachauka.menu.Category;

public record CategoryResponse(
    Long id,
    String name,
    String icon,
    int sortOrder
) {
    public static CategoryResponse from(Category category) {
        if (category == null) return null;
        return new CategoryResponse(
            category.getId(),
            category.getName(),
            category.getIcon(),
            category.getSortOrder()
        );
    }
}
