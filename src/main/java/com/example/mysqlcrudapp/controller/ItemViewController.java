package com.example.mysqlcrudapp.controller;

import com.example.mysqlcrudapp.entity.Blueprint;
import com.example.mysqlcrudapp.entity.BlueprintVersion;
import com.example.mysqlcrudapp.entity.Item;
import com.example.mysqlcrudapp.exception.ResourceNotFoundException;
import com.example.mysqlcrudapp.repository.BlueprintRepository;
import com.example.mysqlcrudapp.service.BlueprintService;
import com.example.mysqlcrudapp.service.BlueprintVersionService;
import com.example.mysqlcrudapp.service.ItemService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import javax.validation.Valid;
import java.util.List;
import java.util.Optional;

@Controller
@RequiredArgsConstructor
public class ItemViewController {
    private final ItemService itemService;
    private final BlueprintService blueprintService;
    private final BlueprintVersionService blueprintVersionService;
    private final BlueprintRepository blueprintRepository;

    @GetMapping("/items")
    public String listItems(Model model) {
        model.addAttribute("title", "Items");
        model.addAttribute("items", itemService.findAll());
        model.addAttribute("newItem", new Item());
        model.addAttribute("blueprints", blueprintService.findAll());
        return "items";
    }

    @PostMapping("/items")
    public String createItem(@Valid @ModelAttribute("newItem") Item item,
                           @RequestParam("blueprintId") Long blueprintId,
                           @RequestParam("versionId") Long versionId,
                           BindingResult result,
                           RedirectAttributes redirectAttributes) {
        if (result.hasErrors()) {
            redirectAttributes.addFlashAttribute("error", "Error creating item: " + 
                result.getAllErrors().get(0).getDefaultMessage());
            return "redirect:/items";
        }

        try {
            Blueprint blueprint = blueprintRepository.findById(blueprintId)
                .orElseThrow(() -> new ResourceNotFoundException("Blueprint not found with id: " + blueprintId));
            
            BlueprintVersion version = blueprintVersionService.findById(versionId);
            
            item.setBlueprint(blueprint);
            item.setVersion(version);
            
            itemService.create(item);
            redirectAttributes.addFlashAttribute("success", "Item created successfully");
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("error", "Error creating item: " + e.getMessage());
        }
        
        return "redirect:/items";
    }

    @GetMapping("/items/{id}")
    @ResponseBody
    public Item getItem(@PathVariable Long id) {
        return itemService.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Item not found with id: " + id));
    }

    @PutMapping("/items/{id}")
    public String updateItem(@PathVariable Long id,
                           @Valid @ModelAttribute("item") Item item,
                           @RequestParam(value = "blueprintId", required = false) Long blueprintId,
                           @RequestParam(value = "versionId", required = false) Long versionId,
                           BindingResult result,
                           RedirectAttributes redirectAttributes) {
        if (result.hasErrors()) {
            redirectAttributes.addFlashAttribute("error", "Error updating item: " + 
                result.getAllErrors().get(0).getDefaultMessage());
            return "redirect:/items";
        }
        
        try {
            Optional<Item> existingItemOpt = itemService.findById(id);
            if (existingItemOpt.isPresent()) {
                Item existingItem = existingItemOpt.get();
                
                existingItem.setCurrentState(item.getCurrentState());
                
                if (blueprintId != null && versionId != null) {
                    Blueprint blueprint = blueprintRepository.findById(blueprintId)
                        .orElseThrow(() -> new ResourceNotFoundException("Blueprint not found with id: " + blueprintId));
                    
                    BlueprintVersion version = blueprintVersionService.findById(versionId);
                    existingItem.setBlueprint(blueprint);
                    existingItem.setVersion(version);
                }
                
                itemService.update(id, existingItem);
                redirectAttributes.addFlashAttribute("success", "Item updated successfully");
            } else {
                redirectAttributes.addFlashAttribute("error", "Item not found");
            }
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("error", "Error updating item: " + e.getMessage());
        }
        
        return "redirect:/items";
    }

    @DeleteMapping("/items/{id}")
    public String deleteItem(@PathVariable Long id, RedirectAttributes redirectAttributes) {
        try {
            itemService.deleteById(id);
            redirectAttributes.addFlashAttribute("success", "Item deleted successfully");
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("error", "Error deleting item: " + e.getMessage());
        }
        
        return "redirect:/items";
    }
    
    @GetMapping("/blueprints/{blueprintId}/versions")
    @ResponseBody
    public List<BlueprintVersion> getVersionsForBlueprint(@PathVariable Long blueprintId) {
        return blueprintVersionService.findByBlueprintId(blueprintId);
    }
}
