package com.chulhachauka.admin;

import com.chulhachauka.common.dto.ApiResponse;
import com.chulhachauka.menu.MenuService;
import com.chulhachauka.menu.dto.CategoryResponse;
import com.chulhachauka.menu.dto.MenuItemRequest;
import com.chulhachauka.menu.dto.MenuItemResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/admin/menu")
@RequiredArgsConstructor
public class AdminMenuController {

    private final MenuService menuService;

    @PostMapping("/items")
    public ResponseEntity<ApiResponse<MenuItemResponse>> createItem(@Valid @RequestBody MenuItemRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(menuService.createItem(req)));
    }

    @PutMapping("/items/{id}")
    public ResponseEntity<ApiResponse<MenuItemResponse>> updateItem(
            @PathVariable Long id,
            @Valid @RequestBody MenuItemRequest req
    ) {
        return ResponseEntity.ok(ApiResponse.ok(menuService.updateItem(id, req)));
    }

    @PatchMapping("/items/{id}/availability")
    public ResponseEntity<ApiResponse<MenuItemResponse>> patchAvailability(
            @PathVariable Long id,
            @RequestParam boolean available
    ) {
        return ResponseEntity.ok(ApiResponse.ok(menuService.patchAvailability(id, available)));
    }

    @PatchMapping("/items/{id}/price")
    public ResponseEntity<ApiResponse<MenuItemResponse>> patchPrice(
            @PathVariable Long id,
            @RequestParam long pricePaise
    ) {
        return ResponseEntity.ok(ApiResponse.ok(menuService.patchPrice(id, pricePaise)));
    }

    @DeleteMapping("/items/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteItem(@PathVariable Long id) {
        menuService.deleteItem(id);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    @PostMapping("/categories")
    public ResponseEntity<ApiResponse<CategoryResponse>> createCategory(
            @RequestParam String name,
            @RequestParam(required = false) String icon,
            @RequestParam(defaultValue = "0") int sortOrder
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(menuService.createCategory(name, icon, sortOrder)));
    }

    @PutMapping("/categories/{id}")
    public ResponseEntity<ApiResponse<CategoryResponse>> updateCategory(
            @PathVariable Long id,
            @RequestParam String name,
            @RequestParam(required = false) String icon,
            @RequestParam(defaultValue = "0") int sortOrder,
            @RequestParam(defaultValue = "true") boolean active
    ) {
        return ResponseEntity.ok(ApiResponse.ok(menuService.updateCategory(id, name, icon, sortOrder, active)));
    }

    @DeleteMapping("/categories/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteCategory(@PathVariable Long id) {
        menuService.deleteCategory(id);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }
}
