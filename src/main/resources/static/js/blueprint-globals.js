/**
 * Global Blueprint Functions
 * This file adds global versions of blueprint functions to support inline onclick handlers.
 */

// Make the functions globally available for inline event handlers
window.viewVersions = function(id) {
    console.log('Global viewVersions called with ID:', id);
    window.location.href = `/blueprints/${id}`;
};

window.editBlueprint = function(id) {
    console.log('Global editBlueprint called with ID:', id);
    if (typeof fetchWithCsrf !== 'function') {
        console.error('CSRF utility functions not found. Make sure csrf.js is loaded.');
        alert('Error: CSRF utility not available. Please refresh the page.');
        return;
    }
    
    fetchWithCsrf(`/api/blueprints/${id}`)
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to fetch blueprint details');
        }
        return response.json();
    })
    .then(blueprint => {
        console.log('Blueprint details fetched:', blueprint);
        
        // Clone the create modal and modify it for editing
        const createModal = document.getElementById('createBlueprintModal');
        
        if (!createModal) {
            throw new Error('Create blueprint modal not found');
        }
        
        // Check if edit modal already exists, if not create it
        let editModal = document.getElementById('editBlueprintModal');
        
        if (!editModal) {
            // Clone the create modal
            const modalClone = createModal.cloneNode(true);
            modalClone.id = 'editBlueprintModal';
            
            // Update modal title and button
            const modalTitle = modalClone.querySelector('.modal-title');
            if (modalTitle) {
                modalTitle.textContent = 'Edit Blueprint';
            }
            
            const submitButton = modalClone.querySelector('#createButton');
            if (submitButton) {
                submitButton.id = 'updateButton';
                submitButton.textContent = 'Update';
            }
            
            // Update form ID
            const form = modalClone.querySelector('form');
            if (form) {
                form.id = 'editBlueprintForm';
                
                // Add hidden ID field
                const idInput = document.createElement('input');
                idInput.type = 'hidden';
                idInput.id = 'editBlueprintId';
                idInput.name = 'id';
                idInput.value = blueprint.id;
                form.appendChild(idInput);
            }
            
            // Append the new modal to the body
            document.body.appendChild(modalClone);
            editModal = modalClone;
            
            // Add event listener for form submission
            const editForm = document.getElementById('editBlueprintForm');
            if (editForm) {
                editForm.addEventListener('submit', function(event) {
                    event.preventDefault();
                    submitEditBlueprint();
                });
            }
            
            // Add event listener for update button
            const updateBtn = document.getElementById('updateButton');
            if (updateBtn) {
                updateBtn.addEventListener('click', function(event) {
                    event.preventDefault();
                    submitEditBlueprint();
                });
            }
        }
        
        // Fill the form with blueprint data
        document.getElementById('editBlueprintId').value = blueprint.id;
        const nameInput = editModal.querySelector('input[name="name"]');
        const descriptionInput = editModal.querySelector('textarea[name="description"]');
        
        if (nameInput) {
            nameInput.value = blueprint.name;
        }
        if (descriptionInput) {
            descriptionInput.value = blueprint.description || '';
        }
        
        // Show the modal
        const bsModal = new bootstrap.Modal(editModal);
        bsModal.show();
    })
    .catch(error => {
        console.error('Error fetching blueprint details:', error);
        alert('Error fetching blueprint details: ' + error.message);
    });
};

window.deleteBlueprint = function(id) {
    console.log('Global deleteBlueprint called with ID:', id);
    if (typeof fetchWithCsrf !== 'function') {
        console.error('CSRF utility functions not found. Make sure csrf.js is loaded.');
        alert('Error: CSRF utility not available. Please refresh the page.');
        return;
    }
    
    if (confirm('Are you sure you want to delete this blueprint?')) {
        fetchWithCsrf(`/api/blueprints/${id}`, {
            method: 'DELETE'
        }).then(response => {
            console.log('Delete response status:', response.status);
            if (response.ok) {
                window.location.reload();
            } else {
                return response.text().then(text => {
                    throw new Error(text || 'Error deleting blueprint');
                });
            }
        }).catch(error => {
            console.error('Error deleting blueprint:', error);
            alert('Error deleting blueprint: ' + error.message);
        });
    }
};

// Ensure we have access to the submitEditBlueprint function
window.submitEditBlueprint = function() {
    console.log('Global submitEditBlueprint function called');
    
    // Get form and validate inputs
    const form = document.getElementById('editBlueprintForm');
    if (!form) {
        console.error('Edit blueprint form not found');
        return;
    }
    
    const nameInput = form.querySelector('input[name="name"]');
    const descInput = form.querySelector('textarea[name="description"]');
    const idInput = document.getElementById('editBlueprintId');
    const errorAlert = form.querySelector('.alert-danger');
    const errorMessage = form.querySelector('#errorMessage');
    
    // Clear previous errors
    if (errorAlert) {
        errorAlert.classList.add('d-none');
    }
    
    // Validate inputs
    if (!nameInput || !nameInput.value.trim()) {
        if (errorAlert && errorMessage) {
            errorAlert.classList.remove('d-none');
            errorMessage.textContent = 'Name is required';
        }
        if (nameInput) nameInput.focus();
        return;
    }
    
    if (!idInput || !idInput.value) {
        console.error('Blueprint ID not found');
        return;
    }
    
    // Check if CSRF functionality is available
    if (typeof getCsrfToken !== 'function' || typeof fetchWithCsrf !== 'function') {
        console.error('CSRF utility functions not found. Make sure csrf.js is loaded.');
        if (errorAlert && errorMessage) {
            errorAlert.classList.remove('d-none');
            errorMessage.textContent = 'Authentication error. Please refresh the page.';
        }
        return;
    }
    
    // Verify CSRF token availability
    const csrf = getCsrfToken();
    if (!csrf.value) {
        console.error('CSRF token not found');
        if (errorAlert && errorMessage) {
            errorAlert.classList.remove('d-none');
            errorMessage.textContent = 'Authentication error. Please refresh the page.';
        }
        return;
    }

    // Prepare data
    const data = {
        name: nameInput.value.trim(),
        description: descInput ? descInput.value.trim() : '',
    };
    
    console.log('Submitting updated blueprint data:', data);

    // Show loading indicator on the button
    const submitBtn = document.getElementById('updateButton');
    if (!submitBtn) {
        console.error('Update button not found');
        return;
    }
    
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Updating...';
    
    // Make API request using fetchWithCsrf
    fetchWithCsrf(`/api/blueprints/${idInput.value}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => {
        console.log('Response status:', response.status);
        
        if (!response.ok) {
            return response.text().then(text => {
                try {
                    const data = JSON.parse(text);
                    throw new Error(data.message || 'Failed to update blueprint');
                } catch (e) {
                    throw new Error('Failed to update blueprint: ' + text);
                }
            });
        }
        
        return response.json();
    })
    .then(data => {
        console.log('Blueprint updated successfully:', data);
        
        // Close the modal first
        const modal = document.getElementById('editBlueprintModal');
        if (modal) {
            const bsModal = bootstrap.Modal.getInstance(modal);
            if (bsModal) {
                console.log('Closing modal with Bootstrap API');
                bsModal.hide();
            }
        }
        
        // Show success message and redirect
        window.location.href = '/blueprints?success=Blueprint updated successfully';
    })
    .catch(error => {
        console.error('Error updating blueprint:', error);
        
        // Reset submit button
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
        
        // Show error message
        if (errorAlert && errorMessage) {
            errorAlert.classList.remove('d-none');
            errorMessage.textContent = error.message || 'An error occurred while updating the blueprint';
        }
    });
};
