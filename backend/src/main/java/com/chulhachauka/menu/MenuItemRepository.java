package com.chulhachauka.menu;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MenuItemRepository extends JpaRepository<MenuItem, Long> {

    List<MenuItem> findByIsAvailableTrueOrderBySortOrderAsc();

    List<MenuItem> findByCategoryAndIsAvailableTrue(Category category);

    List<MenuItem> findByIsBestsellerTrueAndIsAvailableTrue();

    @Query("SELECT m FROM MenuItem m WHERE m.isAvailable = true " +
           "AND (:categoryId IS NULL OR m.category.id = :categoryId) " +
           "AND (:search IS NULL OR LOWER(m.name) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "     OR LOWER(m.description) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "AND (:bestseller IS NULL OR m.isBestseller = :bestseller) " +
           "ORDER BY m.sortOrder ASC, m.id ASC")
    List<MenuItem> searchItems(
        @Param("categoryId") Long categoryId,
        @Param("search") String search,
        @Param("bestseller") Boolean bestseller
    );

    long countByCategoryIdAndIsAvailableTrue(Long categoryId);
}
