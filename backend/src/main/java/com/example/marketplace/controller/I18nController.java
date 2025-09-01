package com.example.marketplace.controller;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController @RequestMapping("/api/i18n")
public class I18nController {
  @GetMapping public Map<String,Object> load(@RequestParam String locale){
    return Map.of("nav.about_us","About Us");
  }
  @PutMapping("/{key}") public Map<String,Object> update(@PathVariable String key, @RequestBody Map<String,String> body){
    // TODO: save to DB
    return Map.of("ok", true, "key", key, "value", body);
  }
}
