package com.LuxMart.entity;

import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Table(name = "category_entity")
@Entity
public class CategoryEntity {
 
   @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String nameEn;
    
    private String nameAz;
    private String nameEs;
    private String nameDe;
    private String emoji;
    
    @Column(unique = true,nullable = false)
    private String slug;

    @ManyToOne
    @JoinColumn(name = "parent_id")
    private CategoryEntity parent;

    @OneToMany(mappedBy = "parent",cascade = CascadeType.ALL)
    private List<CategoryEntity> subcategories = new ArrayList<>();
    
    @OneToMany(mappedBy = "category")
    private List<ProductEntity> products = new ArrayList<>();
    
}
