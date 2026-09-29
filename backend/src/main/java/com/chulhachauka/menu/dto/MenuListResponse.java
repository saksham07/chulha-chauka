package com.chulhachauka.menu.dto;

import java.util.List;

public record MenuListResponse(
    List<MenuItemResponse> items,
    int total
) {}
