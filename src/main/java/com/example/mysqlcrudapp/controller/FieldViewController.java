package com.example.mysqlcrudapp.controller;

import com.example.mysqlcrudapp.entity.Field;
import com.example.mysqlcrudapp.service.FieldService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import javax.validation.Valid;

@Controller
@RequiredArgsConstructor
public class FieldViewController {
    private final FieldService fieldService;

    @GetMapping("/fields")
    public String listFields(Model model) {
        model.addAttribute("title", "Fields");
        model.addAttribute("fields", fieldService.findAll());
        model.addAttribute("newField", new Field());
        return "fields";
    }
      @PostMapping("/fields")
    public String createField(@Valid @ModelAttribute("newField") Field field, 
                              BindingResult result,
                              RedirectAttributes redirectAttributes) {
        if (result.hasErrors()) {
            redirectAttributes.addFlashAttribute("error", "Error creating field: " + 
                result.getAllErrors().get(0).getDefaultMessage());
            return "redirect:/fields";
        }
        
        try {
            fieldService.create(field);
            redirectAttributes.addFlashAttribute("success", "Field created successfully");
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("error", "Error creating field: " + e.getMessage());
        }
        
        return "redirect:/fields";
    }
    
    @GetMapping("/fields/{id}")
    @ResponseBody
    public Field getField(@PathVariable Long id) {
        return fieldService.findById(id);
    }
      @PutMapping("/fields/{id}")
    public String updateField(@PathVariable Long id, 
                             @Valid @ModelAttribute("field") Field field,
                             BindingResult result,
                             RedirectAttributes redirectAttributes) {
        if (result.hasErrors()) {
            redirectAttributes.addFlashAttribute("error", "Error updating field: " + 
                result.getAllErrors().get(0).getDefaultMessage());
            return "redirect:/fields";
        }
        
        try {
            fieldService.update(id, field);
            redirectAttributes.addFlashAttribute("success", "Field updated successfully");
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("error", "Error updating field: " + e.getMessage());
        }
        
        return "redirect:/fields";
    }      @DeleteMapping("/fields/{id}")
    public String deleteField(@PathVariable Long id, RedirectAttributes redirectAttributes) {
        try {
            fieldService.deleteById(id);
            redirectAttributes.addFlashAttribute("success", "Field deleted successfully");
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("error", "Error deleting field: " + e.getMessage());
        }
        
        return "redirect:/fields";
    }
}
