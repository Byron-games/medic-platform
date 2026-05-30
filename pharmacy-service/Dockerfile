# Stage 1: Build
FROM maven:3.9.9-eclipse-temurin-21 AS builder
WORKDIR /app
# Copy parent POM first (layer caching)
COPY pom.xml ./pom.xml
RUN mvn install -N -q
# Copy service POM and pre-fetch dependencies
COPY pharmacy-service/pom.xml ./pharmacy-service/pom.xml
RUN mvn dependency:go-offline -q -f pharmacy-service/pom.xml
# Build the service
COPY pharmacy-service/src ./pharmacy-service/src
RUN mvn package -DskipTests -q -f pharmacy-service/pom.xml

# Stage 2: Runtime (minimal Alpine JRE)
FROM eclipse-temurin:21-jre-alpine
RUN addgroup -S medic && adduser -S medic -G medic
WORKDIR /app
USER medic
COPY --from=builder --chown=medic:medic /app/pharmacy-service/target/*.jar app.jar
HEALTHCHECK --interval=30s --timeout=10s --start-period=90s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8085/actuator/health || exit 1
EXPOSE 8085
ENTRYPOINT ["java", \
  "-XX:+UseContainerSupport", \
  "-XX:MaxRAMPercentage=75.0", \
  "-Djava.security.egd=file:/dev/./urandom", \
  "-jar", "app.jar"]
