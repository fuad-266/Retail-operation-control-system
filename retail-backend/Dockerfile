# ==========================================
# Build Stage
# ==========================================
FROM maven:3.9.6-eclipse-temurin-21-alpine AS builder
WORKDIR /app

# Copy the pom.xml and source code
COPY pom.xml .
COPY src ./src

# Build the application (skipping tests for faster deployment)
RUN mvn clean package -DskipTests

# ==========================================
# Run Stage
# ==========================================
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Expose the port the app runs on
EXPOSE 8080

# Copy the built JAR from the builder stage
COPY --from=builder /app/target/*.jar app.jar

# Run the Spring Boot application
ENTRYPOINT ["java", "-jar", "app.jar"]
