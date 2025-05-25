// Field management standalone functions
// These are globally accessible functions for field management

// Helper to validate JSON string
window.isValidJson = function(str) {
    try {
        JSON.parse(str);
        return true;
    } catch (e) {
        return false;
    }
};

// Helper to ensure valid JSON or return default
window.ensureValidJson = function(value, defaultValue = '{}') {
    if (!value || value.trim() === '') return defaultValue;
    try {
        // Try parsing and re-stringifying to ensure proper format
        const parsed = JSON.parse(value.trim());
        return JSON.stringify(parsed);
    } catch (e) {
        return defaultValue;
    }
};

// Update fields based on selected type
window.updateTypeSpecificFields = function(mode = '') {
    console.log(`updateTypeSpecificFields called with mode: ${mode}`);
    const prefix = mode === 'edit' ? 'edit' : '';
    const typeId = prefix ? `${prefix}Type` : 'type';
    const numberFieldsId = prefix ? `${prefix}NumberFields` : 'numberFields';
    
    const typeSelect = document.getElementById(typeId);
    if (!typeSelect) {
        console.warn(`Type select element with ID '${typeId}' not found`);
        return;
    }
    
    const numberFieldsDiv = document.getElementById(numberFieldsId);
    if (numberFieldsDiv) {
        if (typeSelect.value === 'number') {
            console.log(`Showing number fields for ${mode}`);
            numberFieldsDiv.style.display = 'flex';
        } else {
            console.log(`Hiding number fields for ${mode}`);
            numberFieldsDiv.style.display = 'none';
        }
    } else {
        console.warn(`Number fields div with ID '${numberFieldsId}' not found`);
    }
};

// Edit a field
window.editField = function(id) {
    console.log('Global editField called with ID:', id);
    
    // Capture current page state before loading field data
    if (window.PageCache) {
        PageCache.captureCurrentPageState();
    }
    
    if (typeof fetchWithCsrf !== 'function') {
        console.error('CSRF utility not available');
        return;
    }
    
    console.log(`Fetching field data for ID ${id}...`);
    
    fetchWithCsrf(`/api/fields/${id}`, {
        method: 'GET'
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`Failed to load field: ${response.status}`);
        }
        return response.json();
    })
    .then(field => {
        // Populate form fields
        document.getElementById('editFieldId').value = field.id;
        document.getElementById('editKey').value = field.key;
        document.getElementById('editLabel').value = field.label;
        document.getElementById('editDescription').value = field.description || '';
        document.getElementById('editType').value = field.type;
        document.getElementById('editWidget').value = field.widget || '';
        document.getElementById('editOrderIndex').value = field.orderIndex || 0;
        document.getElementById('editGroupName').value = field.groupName || '';
          
        // Handle number fields
        if (field.type === 'number') {
            document.getElementById('editMinNumber').value = field.minNumber || '';
            document.getElementById('editMaxNumber').value = field.maxNumber || '';
        }
        
        // Handle JSON fields with proper formatting
        try {
            // Format JSON fields for display
            document.getElementById('editValidationJson').value = 
                field.validationJson ? JSON.stringify(JSON.parse(field.validationJson), null, 2) : '';
            document.getElementById('editDefaultJson').value = 
                field.defaultJson ? JSON.stringify(JSON.parse(field.defaultJson), null, 2) : '';
            document.getElementById('editOptionsJson').value = 
                field.optionsJson ? JSON.stringify(JSON.parse(field.optionsJson), null, 2) : '';
            document.getElementById('editSettingsJson').value = 
                field.settingsJson ? JSON.stringify(JSON.parse(field.settingsJson), null, 2) : '';
        } catch (e) {
            console.error('Error formatting JSON fields:', e);
            // Fallback to raw values if parsing fails
            document.getElementById('editValidationJson').value = field.validationJson || '';
            document.getElementById('editDefaultJson').value = field.defaultJson || '';
            document.getElementById('editOptionsJson').value = field.optionsJson || '';
            document.getElementById('editSettingsJson').value = field.settingsJson || '';
        }
        
        // Update UI based on type
        window.updateTypeSpecificFields('edit');
        
        // Show the modal
        const modal = new bootstrap.Modal(document.getElementById('editFieldModal'));
        modal.show();
    })
    .catch(error => {
        console.error('Error loading field:', error);
        alert('Error loading field: ' + error.message);
    });
};

// Create a new field
window.submitCreateField = function(event) {
    event.preventDefault();
    
    const errorMessage = document.getElementById('createFieldErrorMessage');
    errorMessage.textContent = '';
    errorMessage.style.display = 'none';
    
    // Get form data
    const form = document.getElementById('createFieldForm');
    const formData = new FormData(form);
    
    // Create data object from form
    const data = {
        key: formData.get('key'),
        label: formData.get('label'),
        description: formData.get('description') || '',
        type: formData.get('type'),
        widget: formData.get('widget') || null,
        orderIndex: parseInt(formData.get('orderIndex')) || 0,
        groupName: formData.get('groupName') || null
    };
    
    console.log('Creating new field');
    
    // Handle number-specific fields
    if (data.type === 'number') {
        data.minNumber = formData.get('minNumber') ? parseFloat(formData.get('minNumber')) : null;
        data.maxNumber = formData.get('maxNumber') ? parseFloat(formData.get('maxNumber')) : null;
    } else {
        // Ensure these are null when not relevant
        data.minNumber = null;
        data.maxNumber = null;
    }
      
    // Handle JSON fields - MySQL JSON type requires valid JSON (not null)
    const jsonFields = {
        validationJson: formData.get('validationJson'),
        defaultJson: formData.get('defaultJson'),
        optionsJson: formData.get('optionsJson'),
        settingsJson: formData.get('settingsJson')
    };
    
    for (const [key, value] of Object.entries(jsonFields)) {
        try {
            // Always ensure we have valid JSON for these fields
            data[key] = window.ensureValidJson(value);
        } catch (e) {
            errorMessage.textContent = `Invalid JSON in ${key} field`;
            errorMessage.style.display = 'block';
            return;
        }
    }
    
    // Show loading indicator on the button
    const submitBtn = document.getElementById('createButton');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Creating...';
    
    // Log the data being sent for debugging
    console.log('Sending new field data:', data);
    
    // Submit the data
    fetchWithCsrf(`/api/fields`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => {
        console.log('Create response status:', response.status);
        
        if (!response.ok) {
            return response.text().then(text => {
                console.error('Error response body:', text);
                throw new Error(text || `Failed to create field (Status: ${response.status})`);
            });
        }
        return response.json();
    })
    .then((data) => {
        console.log('Field created successfully:', data);
        
        // Clear page cache and trigger success event
        if (window.PageCache) {
            PageCache.clearCurrentPageCache();
            
            // Trigger AJAX success event
            triggerAjaxSuccess({
                type: 'field',
                action: 'create',
                data: data
            });
        }
        
        // Show success message
        const successAlert = document.createElement('div');
        successAlert.className = 'alert alert-success';
        successAlert.textContent = 'Field created successfully!';
        document.getElementById('createFieldModal').querySelector('.modal-body').prepend(successAlert);
        
        // Close the modal and reload after a short delay
        setTimeout(() => {
            const modal = bootstrap.Modal.getInstance(document.getElementById('createFieldModal'));
            modal.hide();
            window.location.reload();
        }, 1000);
    })
    .catch(error => {
        errorMessage.textContent = `Error creating field: ${error.message}`;
        errorMessage.style.display = 'block';
        console.error('Create error:', error);
    })
    .finally(() => {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    });
};

// Delete a field
window.deleteField = function(id) {
    console.log('Global deleteField called with ID:', id);
    
    if (typeof fetchWithCsrf !== 'function') {
        console.error('CSRF utility not available');
        return;
    }
    
    if (!confirm(`Are you sure you want to delete field #${id}? This action cannot be undone.`)) {
        return;
    }
    
    // Capture page state before deletion
    if (window.PageCache) {
        PageCache.captureCurrentPageState();
    }
    
    fetchWithCsrf(`/api/fields/${id}`, {
        method: 'DELETE'
    })
    .then(response => {
        if (!response.ok) {
            return response.text().then(text => {
                throw new Error(text || `Failed to delete field (Status: ${response.status})`);
            });
        }
        
        // Clear page cache and trigger success event after deletion
        if (window.PageCache) {
            PageCache.clearCurrentPageCache();
            
            // Trigger AJAX success event
            triggerAjaxSuccess({
                type: 'field',
                action: 'delete',
                data: { id: id }
            });
        }
        
        // Reload the page to reflect changes
        window.location.reload();
    })
    .catch(error => {
        console.error('Error deleting field:', error);
        alert('Error deleting field: ' + error.message);
    });
};

// Handle submit for updating fields
window.submitEditField = function(event) {
    event.preventDefault();
    
    const errorMessage = document.getElementById('editFieldErrorMessage');
    errorMessage.textContent = '';
    errorMessage.style.display = 'none';
    
    // Get form data
    const form = document.getElementById('editFieldForm');
    const formData = new FormData(form);
    const fieldId = formData.get('id');
    
    // Create data object from form - include the ID for proper mapping
    const data = {
        id: parseInt(fieldId),
        key: formData.get('key'),
        label: formData.get('label'),
        description: formData.get('description') || '',
        type: formData.get('type'),
        widget: formData.get('widget') || null,
        orderIndex: parseInt(formData.get('orderIndex')) || 0,
        groupName: formData.get('groupName') || null
    };
    
    console.log('Submitting field update with ID:', fieldId);
    
    // Handle number-specific fields
    if (data.type === 'number') {
        data.minNumber = formData.get('minNumber') ? parseFloat(formData.get('minNumber')) : null;
        data.maxNumber = formData.get('maxNumber') ? parseFloat(formData.get('maxNumber')) : null;
    } else {
        // Ensure these are null when not relevant
        data.minNumber = null;
        data.maxNumber = null;
    }
      
    // Handle JSON fields - MySQL JSON type requires valid JSON (not null)
    const jsonFields = {
        validationJson: formData.get('validationJson'),
        defaultJson: formData.get('defaultJson'),
        optionsJson: formData.get('optionsJson'),
        settingsJson: formData.get('settingsJson')
    };
    
    for (const [key, value] of Object.entries(jsonFields)) {
        try {
            // Always ensure we have valid JSON for these fields
            data[key] = window.ensureValidJson(value);
        } catch (e) {
            errorMessage.textContent = `Invalid JSON in ${key} field`;
            errorMessage.style.display = 'block';
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            }
            return;
        }
    }
    
    // Show loading indicator on the button
    const submitBtn = document.getElementById('updateButton');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Updating...';
    
    // Log the data being sent for debugging
    console.log('Sending field data:', data);
    
    // Submit the data
    fetchWithCsrf(`/api/fields/${fieldId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => {
        console.log('Update response status:', response.status);
        
        if (!response.ok) {
            return response.text().then(text => {
                console.error('Error response body:', text);
                throw new Error(text || `Failed to update field (Status: ${response.status})`);
            });
        }
        return response.json();
    })
    .then((data) => {
        console.log('Field updated successfully:', data);
        
        // Clear page cache and trigger success event
        if (window.PageCache) {
            PageCache.clearCurrentPageCache();
            
            // Trigger AJAX success event
            triggerAjaxSuccess({
                type: 'field',
                action: 'update',
                data: data
            });
        }
        
        // Show success message
        const successAlert = document.createElement('div');
        successAlert.className = 'alert alert-success';
        successAlert.textContent = 'Field updated successfully!';
        document.getElementById('editFieldModal').querySelector('.modal-body').prepend(successAlert);
        
        // Close the modal and reload after a short delay
        setTimeout(() => {
            const modal = bootstrap.Modal.getInstance(document.getElementById('editFieldModal'));
            modal.hide();
            window.location.reload();
        }, 1000);
    })
    .catch(error => {
        errorMessage.textContent = `Error updating field: ${error.message}`;
        errorMessage.style.display = 'block';
        console.error('Update error:', error);
    })
    .finally(() => {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    });
};
