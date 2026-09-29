package com.chulhachauka.cart;

import com.chulhachauka.cart.dto.CartItemResponse;
import com.chulhachauka.cart.dto.CartResponse;
import com.chulhachauka.common.exception.BusinessException;
import com.chulhachauka.common.exception.ResourceNotFoundException;
import com.chulhachauka.deliveryconfig.DeliveryConfigService;
import com.chulhachauka.deliveryconfig.dto.DeliveryConfigResponse;
import com.chulhachauka.menu.MenuItem;
import com.chulhachauka.menu.MenuItemRepository;
import com.chulhachauka.user.User;
import com.chulhachauka.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class CartService {

    private final CartRepository cartRepository;
    private final MenuItemRepository menuItemRepository;
    private final UserRepository userRepository;
    private final DeliveryConfigService deliveryConfigService;

    @Transactional(readOnly = true)
    public CartResponse getCart(Long userId) {
        Cart cart = cartRepository.findByUserId(userId)
                .orElse(null);

        DeliveryConfigResponse config = deliveryConfigService.getConfig();

        if (cart == null || cart.getItems().isEmpty()) {
            return new CartResponse(List.of(), 0, 0, 0, config.estimatedMinutes(), true);
        }

        List<CartItemResponse> itemResponses = cart.getItems().stream()
                .map(CartItemResponse::from)
                .toList();

        long subtotalRupees = itemResponses.stream()
                .mapToLong(CartItemResponse::lineTotal)
                .sum();

        long deliveryFee = subtotalRupees > 0 ? config.deliveryFeeRupees() : 0;
        long total = subtotalRupees + deliveryFee;

        return new CartResponse(
                itemResponses,
                subtotalRupees,
                deliveryFee,
                total,
                config.estimatedMinutes(),
                false
        );
    }

    public CartResponse addItem(Long userId, Long menuItemId, int quantity) {
        Cart cart = getOrCreateCart(userId);

        MenuItem item = menuItemRepository.findById(menuItemId)
                .orElseThrow(() -> new ResourceNotFoundException("Menu item with id " + menuItemId + " not found"));

        if (!item.isAvailable()) {
            throw new BusinessException("Item '" + item.getName() + "' is currently unavailable");
        }

        Optional<CartItem> existingItem = cart.getItems().stream()
                .filter(ci -> ci.getMenuItem().getId().equals(menuItemId))
                .findFirst();

        if (existingItem.isPresent()) {
            CartItem ci = existingItem.get();
            int newQty = Math.min(20, ci.getQuantity() + quantity);
            ci.setQuantity(newQty);
        } else {
            CartItem newItem = CartItem.builder()
                    .cart(cart)
                    .menuItem(item)
                    .quantity(Math.min(20, Math.max(1, quantity)))
                    .build();
            cart.getItems().add(newItem);
        }

        cartRepository.save(cart);
        log.info("User {} added item {} (qty: {}) to cart", userId, menuItemId, quantity);
        return getCart(userId);
    }

    public CartResponse updateItem(Long userId, Long menuItemId, int quantity) {
        Cart cart = getOrCreateCart(userId);

        if (quantity <= 0) {
            cart.getItems().removeIf(ci -> ci.getMenuItem().getId().equals(menuItemId));
        } else {
            int capped = Math.min(20, quantity);
            Optional<CartItem> existing = cart.getItems().stream()
                    .filter(ci -> ci.getMenuItem().getId().equals(menuItemId))
                    .findFirst();

            if (existing.isPresent()) {
                existing.get().setQuantity(capped);
            } else {
                MenuItem item = menuItemRepository.findById(menuItemId)
                        .orElseThrow(() -> new ResourceNotFoundException("Menu item with id " + menuItemId + " not found"));
                cart.getItems().add(CartItem.builder()
                        .cart(cart)
                        .menuItem(item)
                        .quantity(capped)
                        .build());
            }
        }

        cartRepository.save(cart);
        return getCart(userId);
    }

    public CartResponse removeItem(Long userId, Long menuItemId) {
        Cart cart = getOrCreateCart(userId);
        cart.getItems().removeIf(ci -> ci.getMenuItem().getId().equals(menuItemId));
        cartRepository.save(cart);
        return getCart(userId);
    }

    public void clearCart(Long userId) {
        cartRepository.findByUserId(userId).ifPresent(cart -> {
            cart.getItems().clear();
            cartRepository.save(cart);
            log.info("Cleared cart for user {}", userId);
        });
    }

    public Cart getOrCreateCart(Long userId) {
        return cartRepository.findByUserId(userId)
                .orElseGet(() -> {
                    User user = userRepository.findById(userId)
                            .orElseThrow(() -> new ResourceNotFoundException("User not found with id " + userId));
                    Cart newCart = Cart.builder()
                            .user(user)
                            .items(new ArrayList<>())
                            .build();
                    return cartRepository.save(newCart);
                });
    }
}
