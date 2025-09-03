package com.LuxMart.exception;

public class StoreNotFoundException extends StoreException {
    public StoreNotFoundException(Long id) {
        super("Store not found with ID: " + id);
    }
}
