package com.chulhachauka.deliveryconfig;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DeliveryConfigRepository extends JpaRepository<DeliveryConfig, Long> {
}
