package com.chulhachauka.cart;

import com.chulhachauka.cart.dto.AddToCartRequest;
import com.chulhachauka.cart.dto.CartResponse;
import com.chulhachauka.common.dto.ApiResponse;
import com.chulhachauka.user.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
public class CartController {

    private final CartService cartService;

    @GetMapping
    public ResponseEntity<ApiResponse<CartResponse>> getCart(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.ok(cartService.getCart(user.getId())));
    }

    @PostMapping("/items")
    public ResponseEntity<ApiResponse<CartResponse>> addItem(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody AddToCartRequest req
    ) {
        return ResponseEntity.ok(ApiResponse.ok(cartService.addItem(user.getId(), req.menuItemId(), req.quantity())));
    }

    @PutMapping("/items/{menuItemId}")
    public ResponseEntity<ApiResponse<CartResponse>> updateItem(
            @AuthenticationPrincipal User user,
            @PathVariable Long menuItemId,
            @RequestParam int quantity
    ) {
        return ResponseEntity.ok(ApiResponse.ok(cartService.updateItem(user.getId(), menuItemId, quantity)));
    }

    @DeleteMapping("/items/{menuItemId}")
    public ResponseEntity<ApiResponse<CartResponse>> removeItem(
            @AuthenticationPrincipal User user,
            @PathVariable Long menuItemId
    ) {
        return ResponseEntity.ok(ApiResponse.ok(cartService.removeItem(user.getId(), menuItemId)));
    }

    @DeleteMapping
    public ResponseEntity<ApiResponse<Void>> clearCart(@AuthenticationPrincipal User user) {
        cartService.clearCart(user.getId());
        return ResponseEntity.noContent().build();
    }
}
