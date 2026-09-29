package com.chulhachauka.deliveryconfig;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "delivery_config")
public class DeliveryConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "delivery_fee_paise", nullable = false)
    @Builder.Default
    private long deliveryFeePaise = 3000;

    @Column(name = "min_order_paise", nullable = false)
    @Builder.Default
    private long minOrderPaise = 0;

    @Column(name = "estimated_minutes", nullable = false)
    @Builder.Default
    private int estimatedMinutes = 40;
}
