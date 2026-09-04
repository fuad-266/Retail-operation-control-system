package com.shop.retailbackend.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.Connection;

@Component
@RequiredArgsConstructor
@Slf4j
@Profile("!test")
public class DatabaseConnectionTest implements CommandLineRunner {

    private final DataSource dataSource;

    @Override
    public void run(String... args) throws Exception {
        try (Connection connection = dataSource.getConnection()) {
            String url = connection.getMetaData().getURL();
            String databaseProductName = connection.getMetaData().getDatabaseProductName();
            String databaseProductVersion = connection.getMetaData().getDatabaseProductVersion();
            
            log.info("=== DATABASE CONNECTION SUCCESS ===");
            log.info("Database URL: {}", maskUrl(url));
            log.info("Database Product: {} {}", databaseProductName, databaseProductVersion);
            log.info("Connection Valid: {}", connection.isValid(5));
            log.info("=====================================");
        } catch (Exception e) {
            log.error("=== DATABASE CONNECTION FAILED ===");
            log.error("Error: {}", e.getMessage());
            log.error("===================================");
            throw e;
        }
    }
    
    private String maskUrl(String url) {
        // Mask password in connection URL for security
        return url.replaceAll(":[^:@]+@", ":****@");
    }
}