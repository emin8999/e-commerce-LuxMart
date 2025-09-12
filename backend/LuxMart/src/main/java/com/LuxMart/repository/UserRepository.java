package com.LuxMart.repository;

import java.time.LocalDateTime;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;

import com.LuxMart.entity.UserEntity;
import com.LuxMart.enums.Roles;

public interface UserRepository extends JpaRepository<UserEntity,Long>,JpaSpecificationExecutor<UserEntity> {

    Optional<UserEntity> findByEmail(String email);
     
    boolean existsByEmail(String email);

     Optional<UserEntity> findByName(String name);

     @Query("SELECT COUNT(u) FROM UserEntity u WHERE SIZE(u.roles) > 0")
    long countByRolesIsNotEmpty();
    
    @Query("SELECT COUNT(u) FROM UserEntity u WHERE SIZE(u.roles) = 0")
    long countByRolesIsEmpty();
    
    long countByCreatedAtGreaterThanEqual(LocalDateTime dateTime);
    
    @Query("SELECT COUNT(u) FROM UserEntity u WHERE :role MEMBER OF u.roles")
    long countByRolesContaining(Roles role);
}
