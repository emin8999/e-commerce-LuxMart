package com.LuxMart.exception;

public class PasswordMismatchException extends UserException {
    public PasswordMismatchException() {
        super("Passwords do not match");
    }
}
