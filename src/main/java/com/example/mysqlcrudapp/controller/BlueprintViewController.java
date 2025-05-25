package com.example.mysqlcrudapp.controller;

import com.example.mysqlcrudapp.dto.BlueprintDto;
import com.example.mysqlcrudapp.service.BlueprintService;
import com.example.mysqlcrudapp.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import javax.validation.Valid;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Controller
@RequiredArgsConstructor
public class BlueprintViewController {    private final BlueprintService blueprintService;
    
    @GetMapping("/blueprints")
    public String listBlueprints(Model model, 
                               @RequestParam(value = "success", required = false) String successMessage,
                               @RequestParam(value = "error", required = false) String errorMessage) {
        try {
            System.out.println("BlueprintViewController: Loading blueprints page");
            List<BlueprintDto> blueprints = blueprintService.findAll();
            
            // Filter out any null entries that might have crept in
            blueprints = blueprints.stream()
                .filter(b -> b != null && b.getId() != null)
                .collect(Collectors.toList());
                
            System.out.println("BlueprintViewController: Found " + blueprints.size() + " valid blueprints");
            
            model.addAttribute("title", "Blueprints");
            model.addAttribute("blueprints", blueprints);
            
            // Handle success message from URL parameter
            if (successMessage != null && !successMessage.isEmpty()) {
                model.addAttribute("success", successMessage);
            }
            
            // Handle error message from URL parameter
            if (errorMessage != null && !errorMessage.isEmpty()) {
                model.addAttribute("error", errorMessage);
            }
            
            return "blueprints";
        } catch (Exception e) {
            System.err.println("BlueprintViewController: Error loading blueprints: " + e.getMessage());
            e.printStackTrace();
            model.addAttribute("error", "Error loading blueprints: " + e.getMessage());
            // Initialize an empty list to prevent null pointer exceptions
            model.addAttribute("blueprints", new ArrayList<>());
            return "blueprints";
        }
    }@GetMapping("/blueprints/{id}")
    public String showBlueprintDetail(@PathVariable Long id, Model model, RedirectAttributes redirectAttributes) {
        try {
            System.out.println("BlueprintViewController: Loading blueprint details for ID: " + id);
            BlueprintDto blueprint = blueprintService.findById(id);
            
            if (blueprint == null) {
                System.err.println("BlueprintViewController: Blueprint not found for ID: " + id);
                redirectAttributes.addFlashAttribute("error", "Blueprint not found with id: " + id);
                return "redirect:/blueprints";
            }
            
            // Add more protection against incomplete data
            if (blueprint.getVersions() == null) {
                System.out.println("BlueprintViewController: Blueprint " + id + " has null versions list, initializing empty list");
                blueprint.setVersions(new ArrayList<>());
            }
            
            System.out.println("BlueprintViewController: Found blueprint: " + blueprint.getName() + " with " + 
                              blueprint.getVersions().size() + " versions");
            
            model.addAttribute("title", blueprint.getName());
            model.addAttribute("blueprint", blueprint);
            return "blueprint-detail";
        } catch (ResourceNotFoundException e) {
            System.err.println("BlueprintViewController: Blueprint not found: " + e.getMessage());
            redirectAttributes.addFlashAttribute("error", e.getMessage());
            return "redirect:/blueprints";
        } catch (Exception e) {
            System.err.println("BlueprintViewController: Error loading blueprint: " + e.getMessage());
            e.printStackTrace();
            // Log the exception stack trace for debugging
            System.err.println("Stack trace:");
            e.printStackTrace();
            
            redirectAttributes.addFlashAttribute("error", "Failed to load blueprint: " + e.getMessage());
            return "redirect:/blueprints";
        }
    }

    @PostMapping("/blueprints")
    public String createBlueprint(@Valid @ModelAttribute("blueprint") BlueprintDto blueprintDto,
                                BindingResult result,
                                RedirectAttributes redirectAttributes) {
        if (result.hasErrors()) {
            redirectAttributes.addFlashAttribute("error", "Error creating blueprint: " + 
                result.getAllErrors().get(0).getDefaultMessage());
            return "redirect:/blueprints";
        }

        try {
            BlueprintDto created = blueprintService.create(blueprintDto);
            redirectAttributes.addFlashAttribute("success", "Blueprint created successfully");
            return "redirect:/blueprints/" + created.getId();
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("error", "Error creating blueprint: " + e.getMessage());
            return "redirect:/blueprints";
        }
    }

    @PutMapping("/blueprints/{id}")
    public String updateBlueprint(@PathVariable Long id,
                                @Valid @ModelAttribute("blueprint") BlueprintDto blueprintDto,
                                BindingResult result,
                                RedirectAttributes redirectAttributes) {
        if (result.hasErrors()) {
            redirectAttributes.addFlashAttribute("error", "Error updating blueprint: " + 
                result.getAllErrors().get(0).getDefaultMessage());
            return "redirect:/blueprints/" + id;
        }

        try {
            BlueprintDto updated = blueprintService.update(id, blueprintDto);
            redirectAttributes.addFlashAttribute("success", "Blueprint updated successfully");
            return "redirect:/blueprints/" + updated.getId();
        } catch (ResourceNotFoundException e) {
            redirectAttributes.addFlashAttribute("error", e.getMessage());
            return "redirect:/blueprints";
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("error", "Error updating blueprint: " + e.getMessage());
            return "redirect:/blueprints/" + id;
        }
    }

    @DeleteMapping("/blueprints/{id}")
    public String deleteBlueprint(@PathVariable Long id, RedirectAttributes redirectAttributes) {
        try {
            if (blueprintService.existsById(id)) {
                blueprintService.deleteById(id);
                redirectAttributes.addFlashAttribute("success", "Blueprint deleted successfully");
            } else {
                redirectAttributes.addFlashAttribute("error", "Blueprint not found");
            }
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("error", "Error deleting blueprint: " + e.getMessage());
        }
        return "redirect:/blueprints";
    }
}
