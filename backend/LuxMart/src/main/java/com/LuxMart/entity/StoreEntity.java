package com.LuxMart.entity;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.jar.Attributes.Name;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import com.LuxMart.enums.Roles;

import jakarta.persistence.CascadeType;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Table(name = "store_entity")
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Entity
public class StoreEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false,unique = true)
    private String storeName;

    @Column(nullable = false)
    private String ownerName;
    
    @Column(unique = true)
    private String slug;

    @Column(nullable = false,unique = true)
    private String email;

    @Column(nullable = false)
    private String password;
    
    @Column(nullable = false)
    private String storeDescription;

    @Column(nullable = false)
    private String logo;

    @Column(nullable = false, unique = true)
    private String phone;

    @Column(nullable = false)
    private String location;
    
    @Column(nullable = false)
    private String category;

    @Column(nullable = false)
    private Boolean agreedToTerms;
  

    @OneToMany(mappedBy = "store", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<ProductEntity> productEntities;

    
    @ElementCollection(fetch=FetchType.EAGER)
    @Enumerated(EnumType.STRING)
    @CollectionTable(name="store_entity_roles",schema="myschema",joinColumns =@JoinColumn(name = "store_entity_id"))
    @Column(name="role")
    @Builder.Default
    private Set<Roles> roles = new HashSet<>();
    
    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updateAt;

}
