package com.chulhachauka.menu.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record MenuItemRequest(
    @NotBlank(message = "Name is required")
    @Size(max = 200, message = "Name must not exceed 200 characters")
    String name,

    String description,

    @NotNull(message = "Category ID is required")
    Long categoryId,

    @Min(value = 1, message = "Price in paise must be positive")
    long pricePaise,

    String imageUrl,

    Boolean isVeg,

    Boolean isAvailable,

    Boolean isBestseller,

    Integer sortOrder
) {
    public boolean vegOrDefault() {
        return isVeg == null || isVeg;
    }

    public boolean availableOrDefault() {
        return isAvailable == null || isAvailable;
    }

    public boolean bestsellerOrDefault() {
        return isBestseller != null && isBestseller;
    }

    public int sortOrderOrDefault() {
        return sortOrder != null ? sortOrder : 0;
    }
}
