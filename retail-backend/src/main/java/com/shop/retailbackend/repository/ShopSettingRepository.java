package com.shop.retailbackend.repository;

import com.shop.retailbackend.entity.ShopSetting;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ShopSettingRepository extends JpaRepository<ShopSetting, UUID> {

    Optional<ShopSetting> findBySettingKey(String settingKey);
}
