package com.chulhachauka.menu;

import com.chulhachauka.common.exception.BusinessException;
import com.chulhachauka.common.exception.ResourceNotFoundException;
import com.chulhachauka.menu.dto.CategoryResponse;
import com.chulhachauka.menu.dto.MenuItemRequest;
import com.chulhachauka.menu.dto.MenuItemResponse;
import com.chulhachauka.menu.dto.MenuListResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class MenuService {

    private final CategoryRepository categoryRepository;
    private final MenuItemRepository menuItemRepository;

    @Transactional(readOnly = true)
    public List<CategoryResponse> getCategories() {
        return categoryRepository.findByActiveTrueOrderBySortOrderAsc()
                .stream()
                .map(CategoryResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public MenuListResponse getItems(String categoryName, String search, Boolean bestseller) {
        Long categoryId = null;
        if (categoryName != null && !categoryName.isBlank() && !categoryName.equalsIgnoreCase("All")) {
            Category category = categoryRepository.findByName(categoryName.trim())
                    .orElseThrow(() -> new ResourceNotFoundException("Category '" + categoryName + "' not found"));
            categoryId = category.getId();
        }

        String searchTrimmed = (search != null && !search.isBlank()) ? search.trim().toLowerCase() : null;

        List<MenuItem> items = menuItemRepository.findByIsAvailableTrueOrderBySortOrderAsc();

        if (categoryId != null) {
            final Long targetCatId = categoryId;
            items = items.stream()
                    .filter(m -> m.getCategory() != null && targetCatId.equals(m.getCategory().getId()))
                    .toList();
        }

        if (searchTrimmed != null) {
            final String q = searchTrimmed;
            items = items.stream()
                    .filter(m -> (m.getName() != null && m.getName().toLowerCase().contains(q))
                            || (m.getDescription() != null && m.getDescription().toLowerCase().contains(q)))
                    .toList();
        }

        if (bestseller != null) {
            final boolean isBest = bestseller;
            items = items.stream()
                    .filter(m -> m.isBestseller() == isBest)
                    .toList();
        }

        List<MenuItemResponse> responseItems = items.stream().map(MenuItemResponse::from).toList();
        return new MenuListResponse(responseItems, responseItems.size());
    }

    @Transactional(readOnly = true)
    public MenuItemResponse getItemById(Long id) {
        MenuItem item = menuItemRepository.findById(id)
                .filter(MenuItem::isAvailable)
                .orElseThrow(() -> new ResourceNotFoundException("Menu item with id " + id + " not found"));
        return MenuItemResponse.from(item);
    }

    public MenuItemResponse createItem(MenuItemRequest req) {
        Category category = categoryRepository.findById(req.categoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category with id " + req.categoryId() + " not found"));

        MenuItem item = MenuItem.builder()
                .category(category)
                .name(req.name().trim())
                .description(req.description())
                .pricePaise(req.pricePaise())
                .imageUrl(req.imageUrl())
                .isVeg(req.vegOrDefault())
                .isAvailable(req.availableOrDefault())
                .isBestseller(req.bestsellerOrDefault())
                .sortOrder(req.sortOrderOrDefault())
                .build();

        MenuItem saved = menuItemRepository.save(item);
        log.info("Created menu item '{}' (ID: {})", saved.getName(), saved.getId());
        return MenuItemResponse.from(saved);
    }

    public MenuItemResponse updateItem(Long id, MenuItemRequest req) {
        MenuItem item = menuItemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Menu item with id " + id + " not found"));

        Category category = categoryRepository.findById(req.categoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category with id " + req.categoryId() + " not found"));

        item.setName(req.name().trim());
        item.setDescription(req.description());
        item.setCategory(category);
        item.setPricePaise(req.pricePaise());
        item.setImageUrl(req.imageUrl());
        item.setVeg(req.vegOrDefault());
        item.setAvailable(req.availableOrDefault());
        item.setBestseller(req.bestsellerOrDefault());
        item.setSortOrder(req.sortOrderOrDefault());

        MenuItem updated = menuItemRepository.save(item);
        log.info("Updated menu item ID {}", updated.getId());
        return MenuItemResponse.from(updated);
    }

    public MenuItemResponse patchAvailability(Long id, boolean available) {
        MenuItem item = menuItemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Menu item with id " + id + " not found"));

        item.setAvailable(available);
        MenuItem updated = menuItemRepository.save(item);
        log.info("Patched availability for item ID {} to {}", id, available);
        return MenuItemResponse.from(updated);
    }

    public MenuItemResponse patchPrice(Long id, long pricePaise) {
        if (pricePaise <= 0) {
            throw new BusinessException("Price in paise must be positive");
        }
        MenuItem item = menuItemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Menu item with id " + id + " not found"));

        item.setPricePaise(pricePaise);
        MenuItem updated = menuItemRepository.save(item);
        log.info("Patched price for item ID {} to {} paise", id, pricePaise);
        return MenuItemResponse.from(updated);
    }

    public void deleteItem(Long id) {
        MenuItem item = menuItemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Menu item with id " + id + " not found"));

        item.setAvailable(false);
        menuItemRepository.save(item);
        log.info("Soft-deleted menu item ID {}", id);
    }

    public CategoryResponse createCategory(String name, String icon, int sortOrder) {
        if (categoryRepository.findByName(name.trim()).isPresent()) {
            throw new BusinessException("Category '" + name + "' already exists");
        }
        Category category = Category.builder()
                .name(name.trim())
                .icon(icon)
                .sortOrder(sortOrder)
                .active(true)
                .build();

        Category saved = categoryRepository.save(category);
        return CategoryResponse.from(saved);
    }

    public CategoryResponse updateCategory(Long id, String name, String icon, int sortOrder, boolean active) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category with id " + id + " not found"));

        category.setName(name.trim());
        category.setIcon(icon);
        category.setSortOrder(sortOrder);
        category.setActive(active);

        Category updated = categoryRepository.save(category);
        return CategoryResponse.from(updated);
    }

    public void deleteCategory(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category with id " + id + " not found"));

        long activeCount = menuItemRepository.countByCategoryIdAndIsAvailableTrue(id);
        if (activeCount > 0) {
            throw new BusinessException("Cannot delete category with " + activeCount + " active menu items");
        }
        category.setActive(false);
        categoryRepository.save(category);
    }
}
