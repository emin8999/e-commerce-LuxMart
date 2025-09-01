package com.example.marketplace.entity;
import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

@Entity @Getter @Setter
public class I18nEntry {
  @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;
  private String namespace;
  private String keyName;
  @Column(length=4000) private String enValue;
  @Column(length=4000) private String azValue;
  @Column(length=4000) private String esValue;
  @Column(length=4000) private String deValue;
  private Instant updatedAt;
  private String updatedBy;
}
