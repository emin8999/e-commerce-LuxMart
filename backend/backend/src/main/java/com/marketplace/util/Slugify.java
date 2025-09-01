package com.marketplace.util;
public class Slugify {
  public static String slug(String s){
    if(s==null) return null;
    String x = s.toLowerCase().replaceAll("[^a-z0-9\s-]","").replaceAll("\s+","-").replaceAll("-+","-");
    if(x.isEmpty()) x = "item";
    return x;
  }
}