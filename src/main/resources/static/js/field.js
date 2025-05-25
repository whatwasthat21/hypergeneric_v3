// Field management functionality

// Helper to validate JSON string
function isValidJson(str) {
    try {
        JSON.parse(str);
        return true;
    } catch (e) {
        return false;
    }
}

// Helper to ensure valid JSON or return default
function ensureValidJson(value, defaultValue = '{}') {
    if (!value || value.trim() === '') return defaultValue;
    try {
        // Try parsing and re-stringifying to ensure proper format
        const parsed = JSON.parse(value.trim());
        return JSON.stringify(parsed);
    } catch (e) {
        return defaultValue;
    }
}

// Update fields based on selected type
function updateTypeSpecificFields(mode = '') {
    console.log(`updateTypeSpecificFields called with mode: ${mode}`);
    const prefix = mode === 'edit' ? 'edit' : '';
    const typeId = prefix ? `${prefix}Type` : 'type';
    const numberFieldsId = prefix ? `${prefix}NumberFields` : 'numberFields';
    const minNumberId = prefix ? `${prefix}MinNumber` : 'minNumber';
    const maxNumberId = prefix ? `${prefix}MaxNumber` : 'maxNumber';
    
    const typeElement = document.getElementById(typeId);
    if (!typeElement) {
        console.error(`Type element with ID '${typeId}' not found`);
        return;
    }
    
    const type = typeElement.value;
    const numberFields = document.getElementById(numberFieldsId);
    if (!numberFields) {
        console.error(`Number fields container with ID '${numberFieldsId}' not found`);
        return;
    }
    
    console.log(`Type selected: ${type}, showing number fields: ${type === 'number'}`);
    
    if (type === 'number') {
        numberFields.style.display = 'flex';
    } else {
        numberFields.style.display = 'none';
        // Clear number fields when switching away from number type
        const minNumber = document.getElementById(minNumberId);
        const maxNumber = document.getElementById(maxNumberId);
        if (minNumber) minNumber.value = '';
        if (maxNumber) maxNumber.value = '';
    }
}

// Make function globally available
window.updateTypeSpecificFields = updateTypeSpecificFields;

// Submit field creation form
function submitCreateField(event) {
    event.preventDefault();

    const errorMessage = document.getElementById('createFieldErrorMessage');
    errorMessage.textContent = '';
    errorMessage.style.display = 'none';

    // Get form elements
    const keyInput = document.getElementById('key');
    const labelInput = document.getElementById('label');
    const descriptionInput = document.getElementById('description');
    const typeInput = document.getElementById('type');
    const widgetInput = document.getElementById('widget');
    const orderIndexInput = document.getElementById('orderIndex');
    const groupNameInput = document.getElementById('groupName');
    const minNumberInput = document.getElementById('minNumber');
    const maxNumberInput = document.getElementById('maxNumber');
    const validationJsonInput = document.getElementById('validationJson');
    const defaultJsonInput = document.getElementById('defaultJson');
    const optionsJsonInput = document.getElementById('optionsJson');
    const settingsJsonInput = document.getElementById('settingsJson');

    // Validate required fields
    if (!keyInput.value.trim() || !labelInput.value.trim() || !typeInput.value) {
        errorMessage.textContent = 'Please fill in all required fields (Key, Label, and Type)';
        errorMessage.style.display = 'block';
        return;
    }

    // Prepare data - match the Field entity structure
    const data = {
        key: keyInput.value.trim(),
        label: labelInput.value.trim(),
        description: descriptionInput ? descriptionInput.value.trim() : '',
        type: typeInput.value,
        widget: widgetInput?.value || null,
        orderIndex: orderIndexInput ? parseInt(orderIndexInput.value) || 0 : 0,
        groupName: groupNameInput ? groupNameInput.value.trim() : null
    };

    // Handle number-specific fields
    if (typeInput.value === 'number') {
        data.minNumber = minNumberInput && minNumberInput.value ? parseFloat(minNumberInput.value) : null;
        data.maxNumber = maxNumberInput && maxNumberInput.value ? parseFloat(maxNumberInput.value) : null;
    }    // Handle JSON fields - MySQL JSON type requires valid JSON (not null)
    const jsonFields = {
        validationJson: validationJsonInput?.value,
        defaultJson: defaultJsonInput?.value,
        optionsJson: optionsJsonInput?.value,
        settingsJson: settingsJsonInput?.value
    };

    for (const [key, value] of Object.entries(jsonFields)) {
        try {
            // Always ensure we have valid JSON for these fields
            data[key] = ensureValidJson(value);
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
    const submitBtn = document.getElementById('createButton');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Creating...';
    
    // Submit the data
    fetchWithCsrf('/api/fields', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => {
        if (!response.ok) {
            return response.text().then(text => {
                throw new Error(text || 'Failed to create field');
            });
        }
        return response.json();
    })
    .then(() => {
        window.location.reload();
    })
    .catch(error => {
        errorMessage.textContent = `Error creating field: ${error.message}`;
        errorMessage.style.display = 'block';
        console.error('Error:', error);
    })
    .finally(() => {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    });
}

// Edit Field
function editField(id) {
    console.log(`Fetching field with ID ${id} for editing`);
    const errorMessage = document.getElementById('editFieldErrorMessage');
    if (errorMessage) {
        errorMessage.textContent = '';
        errorMessage.style.display = 'none';
    }
    
    // Fetch field data
    fetchWithCsrf(`/api/fields/${id}`)
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to load field data');
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
        updateTypeSpecificFields('edit');
        
        // Show the modal
        const modal = new bootstrap.Modal(document.getElementById('editFieldModal'));
        modal.show();
    })
    .catch(error => {
        console.error('Error loading field:', error);
        alert('Error loading field: ' + error.message);
    });
}

// Handle edit form submission
function submitEditField(event) {
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
            data[key] = ensureValidJson(value);
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
}

// Delete Field
function deleteField(id) {
    if (confirm('Are you sure you want to delete this field?')) {
        fetchWithCsrf(`/api/fields/${id}`, {
            method: 'DELETE'
        })
        .then(response => {
            if (response.ok) {
                window.location.reload();
            } else {
                throw new Error('Error deleting field');
            }
        })
        .catch(error => {
            alert(error.message);
        });
    }
}

// Initialize event listeners when document is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('Field.js loaded');
    
    // Add event listeners for edit/delete buttons
    document.querySelectorAll('.edit-field-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            if (id) editField(id);
        });
    });
    
    document.querySelectorAll('.delete-field-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            if (id) deleteField(id);
        });
    });
    
    // Initialize form submit handlers
    const createForm = document.getElementById('createFieldForm');
    if (createForm) {
        createForm.addEventListener('submit', function(event) {
            event.preventDefault();
            console.log('Create form submit event triggered');
            submitCreateField(event);
        });
        console.log('Create form submit handler attached');
    } else {
        console.error('Create field form not found');
    }
    
    const editForm = document.getElementById('editFieldForm');
    if (editForm) {
        editForm.addEventListener('submit', function(event) {
            event.preventDefault();
            console.log('Edit form submit event triggered');
            submitEditField(event);
        });
        console.log('Edit form submit handler attached');
    } else {
        console.error('Edit field form not found');
    }
    
    // Initialize modal reset behavior
    const createModal = document.getElementById('createFieldModal');
    if (createModal) {
        createModal.addEventListener('hidden.bs.modal', function () {
            const form = this.querySelector('form');
            if (form) {
                form.reset();
            }
            const errorAlert = this.querySelector('.alert-danger');
            if (errorAlert) {
                errorAlert.style.display = 'none';
            }
        });
        console.log('Create modal reset handler attached');
    }
    
    const editModal = document.getElementById('editFieldModal');
    if (editModal) {
        editModal.addEventListener('hidden.bs.modal', function () {
            const form = this.querySelector('form');
            if (form) {
                form.reset();
            }
            const errorAlert = this.querySelector('.alert-danger');
            if (errorAlert) {
                errorAlert.style.display = 'none';
            }
        });
        console.log('Edit modal reset handler attached');    }

    // Initialize type-specific fields
    updateTypeSpecificFields();
    
    // Attach change event listeners to type selects
    const typeSelect = document.getElementById('type');
    if (typeSelect) {
        typeSelect.addEventListener('change', function() {
            console.log('Type select changed in create form');
            updateTypeSpecificFields();
        });
        console.log('Type select change handler attached for create form');
    }
    
    const editTypeSelect = document.getElementById('editType');
    if (editTypeSelect) {
        editTypeSelect.addEventListener('change', function() {
            console.log('Type select changed in edit form');
            updateTypeSpecificFields('edit');
        });
        console.log('Type select change handler attached for edit form');
    }
});
