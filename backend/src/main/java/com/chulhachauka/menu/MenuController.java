package com.chulhachauka.menu;

import com.chulhachauka.common.dto.ApiResponse;
import com.chulhachauka.menu.dto.CategoryResponse;
import com.chulhachauka.menu.dto.MenuItemResponse;
import com.chulhachauka.menu.dto.MenuListResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/menu")
@RequiredArgsConstructor
public class MenuController {

    private final MenuService menuService;

    @GetMapping("/categories")
    public ResponseEntity<ApiResponse<List<CategoryResponse>>> getCategories() {
        return ResponseEntity.ok(ApiResponse.ok(menuService.getCategories()));
    }

    @GetMapping("/items")
    public ResponseEntity<ApiResponse<MenuListResponse>> getItems(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Boolean bestseller
    ) {
        return ResponseEntity.ok(ApiResponse.ok(menuService.getItems(category, search, bestseller)));
    }

    @GetMapping("/items/{id}")
    public ResponseEntity<ApiResponse<MenuItemResponse>> getItemById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(menuService.getItemById(id)));
    }
}
