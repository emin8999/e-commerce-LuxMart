package com.LuxMart.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.LuxMart.entity.UserAdminNoteEntity;

@Repository
public interface UserAdminNoteRepository extends JpaRepository<UserAdminNoteEntity, Long> {

   // List<UserAdminNoteEntity> findByUserIdOrderByCreatedAtDesc(Long userId);

   @Query("SELECT n FROM UserAdminNoteEntity n WHERE n.user.id = :userId ORDER BY n.createdAt DESC")
List<UserAdminNoteEntity> findByUserIdOrderByCreatedAtDesc(@Param("userId") Long userId);
}