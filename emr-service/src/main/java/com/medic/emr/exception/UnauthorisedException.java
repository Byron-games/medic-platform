package com.medic.emr.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.FORBIDDEN)
public class UnauthorisedException extends RuntimeException {
    public UnauthorisedException(String message) { super(message); }
}
