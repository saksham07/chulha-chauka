package com.chulhachauka.deliveryconfig;

import com.chulhachauka.deliveryconfig.dto.DeliveryConfigResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class DeliveryConfigService {

    private final DeliveryConfigRepository repository;

    @Transactional(readOnly = true)
    public DeliveryConfigResponse getConfig() {
        DeliveryConfig config = repository.findAll().stream().findFirst()
                .orElseGet(() -> repository.save(DeliveryConfig.builder()
                        .deliveryFeePaise(3000)
                        .minOrderPaise(0)
                        .estimatedMinutes(40)
                        .build()));
        return DeliveryConfigResponse.from(config);
    }

    public DeliveryConfigResponse updateConfig(long deliveryFeePaise, long minOrderPaise, int estimatedMinutes) {
        DeliveryConfig config = repository.findAll().stream().findFirst()
                .orElseGet(() -> DeliveryConfig.builder().build());

        config.setDeliveryFeePaise(deliveryFeePaise);
        config.setMinOrderPaise(minOrderPaise);
        config.setEstimatedMinutes(estimatedMinutes);

        DeliveryConfig saved = repository.save(config);
        log.info("Updated delivery config: fee = {} paise, ETA = {} mins", deliveryFeePaise, estimatedMinutes);
        return DeliveryConfigResponse.from(saved);
    }
}
