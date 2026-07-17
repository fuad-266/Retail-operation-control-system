package com.shop.retailbackend.repository;

import com.shop.retailbackend.entity.ExchangeRateSetting;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ExchangeRateSettingRepository extends JpaRepository<ExchangeRateSetting, UUID> {

    @Query("SELECT e FROM ExchangeRateSetting e ORDER BY e.createdAt DESC LIMIT 1")
    Optional<ExchangeRateSetting> findMostRecent();

    List<ExchangeRateSetting> findAllByOrderByCreatedAtDesc();
}
