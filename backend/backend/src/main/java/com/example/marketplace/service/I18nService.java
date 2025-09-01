package com.example.marketplace.service;
import org.springframework.stereotype.Service;
import java.util.Map;

@Service
public class I18nService {
  public Map<String,Object> loadBundle(String locale){
    // TODO: Load from DB; return merged namespaces
    return Map.of("nav.about_us","About Us");
  }
}
