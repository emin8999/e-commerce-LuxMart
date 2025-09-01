# Marketplace Backend (Spring Boot 3 + JPA + Validation + Lombok + H2/PG)
Dev profile: H2 in-memory; Prod profile: PostgreSQL
Run dev:
  cd backend && mvn spring-boot:run
H2 console: http://localhost:8080/h2-console  (JDBC: jdbc:h2:mem:marketplace)
Run prod:
  docker compose up -d
  cd backend && mvn spring-boot:run -Dspring-boot.run.profiles=prod
Generated at 2025-09-01T21:42:08.486239Z
