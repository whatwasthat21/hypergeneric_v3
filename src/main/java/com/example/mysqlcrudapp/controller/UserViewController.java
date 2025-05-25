package com.example.mysqlcrudapp.controller;

import com.example.mysqlcrudapp.entity.User;
import com.example.mysqlcrudapp.exception.ResourceNotFoundException;
import com.example.mysqlcrudapp.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import javax.validation.Valid;
import java.util.Optional;

@Controller
@RequiredArgsConstructor
public class UserViewController {
    private final UserService userService;

    @GetMapping("/users")
    public String listUsers(Model model) {
        model.addAttribute("title", "Users");
        model.addAttribute("users", userService.findAll());
        model.addAttribute("newUser", new User());
        return "users";
    }
    
    @PostMapping("/users")
    public String createUser(@Valid @ModelAttribute("newUser") User user,
                          BindingResult result,
                          RedirectAttributes redirectAttributes) {
        if (result.hasErrors()) {
            redirectAttributes.addFlashAttribute("error", "Error creating user: " + 
                result.getAllErrors().get(0).getDefaultMessage());
            return "redirect:/users";
        }
        
        try {
            userService.create(user);
            redirectAttributes.addFlashAttribute("success", "User created successfully");
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("error", "Error creating user: " + e.getMessage());
        }
        
        return "redirect:/users";
    }
    
    @GetMapping("/users/{id}")
    @ResponseBody
    public User getUser(@PathVariable Long id) {
        Optional<User> userOpt = userService.findById(id);
        return userOpt.orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
    }
    
    @PutMapping("/users/{id}")
    public String updateUser(@PathVariable Long id, @Valid @ModelAttribute("user") User user,
                           BindingResult result, RedirectAttributes redirectAttributes) {
        if (result.hasErrors()) {
            redirectAttributes.addFlashAttribute("error", "Error updating user: " + 
                result.getAllErrors().get(0).getDefaultMessage());
            return "redirect:/users";
        }
        
        try {
            userService.update(id, user)
                    .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
            redirectAttributes.addFlashAttribute("success", "User updated successfully");
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("error", "Error updating user: " + e.getMessage());
        }
        
        return "redirect:/users";
    }
    
    @DeleteMapping("/users/{id}")
    public String deleteUser(@PathVariable Long id, RedirectAttributes redirectAttributes) {
        try {
            if (userService.existsById(id)) {
                userService.deleteById(id);
                redirectAttributes.addFlashAttribute("success", "User deleted successfully");
            } else {
                redirectAttributes.addFlashAttribute("error", "User not found with id: " + id);
            }
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("error", "Error deleting user: " + e.getMessage());
        }
        
        return "redirect:/users";
    }
}
