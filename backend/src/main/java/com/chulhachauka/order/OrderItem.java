package com.chulhachauka.order;

import com.chulhachauka.menu.MenuItem;
import jakarta.persistence.*;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "order_items")
public class OrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "menu_item_id")
    private MenuItem menuItem;

    @Column(name = "name_snapshot", nullable = false, length = 200)
    private String nameSnapshot;

    @Column(name = "price_snapshot", nullable = false)
    private long priceSnapshot; // in paise

    @Column(nullable = false)
    private int quantity;
}
