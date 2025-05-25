package com.example.mysqlcrudapp.service;

import com.example.mysqlcrudapp.entity.User;
import com.example.mysqlcrudapp.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.Optional;

/**
 * Service to handle authentication-related operations
 */
@Service
@RequiredArgsConstructor
public class AuthenticationService {
    
    private final UserRepository userRepository;
    
    /**
     * Get the full name of the currently authenticated user
     * @return the full name of the current user, or "system" if no user is authenticated
     */
    public String getCurrentUserFullName() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        
        if (authentication == null || !authentication.isAuthenticated() || 
            "anonymousUser".equals(authentication.getPrincipal())) {
            return "system";
        }
        
        String login = authentication.getName();
        Optional<User> userOpt = userRepository.findByLogin(login);
        
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            return user.getFullName() != null ? user.getFullName() : login;
        }
        
        // Fallback to login if user not found in database
        return login;
    }
    
    /**
     * Get the login of the currently authenticated user
     * @return the login of the current user, or null if no user is authenticated
     */
    public String getCurrentUserLogin() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        
        if (authentication == null || !authentication.isAuthenticated() || 
            "anonymousUser".equals(authentication.getPrincipal())) {
            return null;
        }
        
        return authentication.getName();
    }
    
    /**
     * Get the currently authenticated user entity
     * @return the current user entity, or empty if no user is authenticated
     */
    public Optional<User> getCurrentUser() {
        String login = getCurrentUserLogin();
        if (login == null) {
            return Optional.empty();
        }
        
        return userRepository.findByLogin(login);
    }
    
    /**
     * Check if a user is currently authenticated
     * @return true if a user is authenticated, false otherwise
     */
    public boolean isAuthenticated() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return authentication != null && authentication.isAuthenticated() && 
               !"anonymousUser".equals(authentication.getPrincipal());
    }
}
