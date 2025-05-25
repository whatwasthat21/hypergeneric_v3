// Item management functionality with CSRF protection
// Uses shared CSRF handling from csrf.js

// Initialize blueprint and version selector
document.addEventListener('DOMContentLoaded', function() {
    const blueprintSelect = document.getElementById('blueprintId');
    const versionSelect = document.getElementById('versionId');
    
    if (blueprintSelect) {
        blueprintSelect.addEventListener('change', function() {
            const blueprintId = this.value;
            if (blueprintId) {
                loadVersions(blueprintId);
            } else {
                // Clear versions dropdown if no blueprint selected
                if (versionSelect) {
                    versionSelect.innerHTML = '<option value="">Select Version</option>';
                    versionSelect.disabled = true;
                }
            }
        });
    }
    
    // Set up click handler for create button
    const createBtn = document.getElementById('createItemBtn');
    if (createBtn) {
        createBtn.addEventListener('click', createItem);
        console.log('Added event listener for create item button');
    }
    
    // Set up click handler for update button
    const updateBtn = document.getElementById('updateItemBtn');
    if (updateBtn) {
        updateBtn.addEventListener('click', function() {
            const editItemId = document.getElementById('editItemId').value;
            updateItem(editItemId);
        });
        console.log('Added event listener for update item button');
    }
    
    // Add event listeners for view buttons in the table
    document.querySelectorAll('.view-item-btn').forEach(button => {
        button.addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            if (id) {
                viewItem(id);
            }
        });
    });
    
    // Add event listeners for edit buttons in the table
    document.querySelectorAll('.edit-item-btn').forEach(button => {
        button.addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            if (id) {
                editItem(id);
            }
        });
    });
    
    // Add event listeners for delete buttons in the table
    document.querySelectorAll('.delete-item-btn').forEach(button => {
        button.addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            if (id) {
                deleteItem(id);
            }
        });
    });
    
    console.log('Item management initialized with CSRF protection');
});

// Load versions for a blueprint
function loadVersions(blueprintId) {
    const versionSelect = document.getElementById('versionId');
    if (!versionSelect) return;
    
    versionSelect.disabled = true;
    versionSelect.innerHTML = '<option value="">Loading...</option>';
    
    fetchWithCsrf(`/blueprints/${blueprintId}/versions`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to load versions');
            }
            return response.json();
        })
        .then(versions => {
            versionSelect.innerHTML = '<option value="">Select Version</option>';
            versions.forEach(version => {
                const option = document.createElement('option');
                option.value = version.id;
                option.textContent = `${version.name} (v${version.versionNumber})`;
                if (version.active) {
                    option.textContent += ' - Active';
                    option.selected = true;
                }
                versionSelect.appendChild(option);
            });
            versionSelect.disabled = false;
        })
        .catch(error => {
            console.error('Error loading versions:', error);
            versionSelect.innerHTML = '<option value="">Error loading versions</option>';
            versionSelect.disabled = true;
        });
}

// Item management functions
function createItem() {
    // Get form and validate inputs
    const form = document.getElementById('createItemForm');
    if (!form) {
        console.error('Create item form not found');
        return;
    }
    
    const blueprintId = document.getElementById('blueprintId').value;
    const versionId = document.getElementById('versionId').value;
    const dataInput = document.getElementById('data');
    
    // Basic validation
    if (!blueprintId) {
        alert('Please select a blueprint');
        return;
    }
    
    if (!versionId) {
        alert('Please select a version');
        return;
    }
    
    // Prepare data
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    
    // Parse JSON data if provided
    if (data.data && data.data.trim()) {
        try {
            data.data = JSON.parse(data.data);
        } catch (e) {
            alert('Invalid JSON data format. Please check your input.');
            return;
        }
    } else {
        data.data = {}; // Empty object if no data provided
    }
    
    console.log('Submitting item data:', data);
    
    // Show loading indicator if available
    const submitBtn = document.querySelector('#createItemModal .btn-primary');
    if (submitBtn) {
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Creating...';
    }    fetchWithCsrf('/api/items', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify(data)
    }).then(response => {
        // Reset button
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
        
        if (response.ok) {
            // Clear cache and trigger success event after creation
            if (window.PageCache) {
                PageCache.clearCurrentPageCache();
                
                // Trigger AJAX success event
                if (typeof triggerAjaxSuccess === 'function') {
                    triggerAjaxSuccess({
                        type: 'item',
                        action: 'create',
                        data: data
                    });
                }
            }
            
            // Close modal and reload page
            const modal = bootstrap.Modal.getInstance(document.getElementById('createItemModal'));
            if (modal) {
                modal.hide();
            }
            window.location.reload();
        } else {
            return response.json().then(errData => {
                throw new Error(errData.message || 'Error creating item');
            });
        }
    }).catch(error => {
        // Reset button
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
        
        console.error('Error creating item:', error);
        alert('Error creating item: ' + error.message);
    });
}

function updateItem(id) {
    // Get form and validate inputs
    const form = document.getElementById('editItemForm');
    if (!form) {
        console.error('Edit item form not found');
        return;
    }
    
    const dataInput = document.getElementById('editData');
    let itemData = {};
    
    // Parse JSON data if provided
    if (dataInput && dataInput.value.trim()) {
        try {
            itemData = JSON.parse(dataInput.value);
        } catch (e) {
            alert('Invalid JSON data format. Please check your input.');
            return;
        }
    }
    
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    data.data = itemData;
    
    console.log('Updating item data:', data);
    
    // Show loading indicator if available
    const submitBtn = document.getElementById('updateItemBtn');
    if (submitBtn) {
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Updating...';
    }
      fetchWithCsrf(`/api/items/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    }).then(response => {
        // Reset button
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
        
        if (response.ok) {
            // Clear cache and trigger success event after update
            if (window.PageCache) {
                PageCache.clearCurrentPageCache();
                
                // Trigger AJAX success event
                if (typeof triggerAjaxSuccess === 'function') {
                    triggerAjaxSuccess({
                        type: 'item',
                        action: 'update',
                        data: data
                    });
                }
            }
            
            // Close modal and reload page
            const modal = bootstrap.Modal.getInstance(document.getElementById('editItemModal'));
            if (modal) {
                modal.hide();
            }
            window.location.reload();
        } else {
            return response.json().then(errData => {
                throw new Error(errData.message || 'Error updating item');
            });
        }
    }).catch(error => {
        // Reset button
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
        
        console.error('Error updating item:', error);
        alert('Error updating item: ' + error.message);
    });
}

function deleteItem(id) {
    // Capture current page state before deletion
    if (window.PageCache) {
        PageCache.captureCurrentPageState();
    }
    
    if (confirm('Are you sure you want to delete this item? This action cannot be undone.')) {
        fetchWithCsrf(`/api/items/${id}`, {
            method: 'DELETE'
        }).then(response => {
            if (response.ok) {
                // Clear cache and trigger success event after deletion
                if (window.PageCache) {
                    PageCache.clearCurrentPageCache();
                    
                    // Trigger AJAX success event
                    if (typeof triggerAjaxSuccess === 'function') {
                        triggerAjaxSuccess({
                            type: 'item',
                            action: 'delete',
                            data: { id: id }
                        });
                    }
                }
                window.location.reload();
            } else {
                return response.json().then(errData => {
                    throw new Error(errData.message || 'Error deleting item');
                });
            }
        }).catch(error => {
            console.error('Error deleting item:', error);
            alert('Error deleting item: ' + error.message);
        });
    }
}

function viewItem(id) {
    // Capture current page state before navigation
    if (window.PageCache) {
        PageCache.captureCurrentPageState();
    }
    window.location.href = `/items/${id}`;
}

function editItem(id) {
    // Capture current page state before loading item data
    if (window.PageCache) {
        PageCache.captureCurrentPageState();
    }
    
    fetchWithCsrf(`/api/items/${id}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch item details');
            }
            return response.json();
        })
        .then(item => {
            // Populate the edit form with item data
            document.getElementById('editItemId').value = item.id;
            
            // Format the item data as JSON string with pretty printing
            const dataInput = document.getElementById('editData');
            if (dataInput) {
                dataInput.value = JSON.stringify(item.data || {}, null, 2);
            }
            
            // Show the modal
            const modal = new bootstrap.Modal(document.getElementById('editItemModal'));
            modal.show();
        })
        .catch(error => {
            console.error('Error loading item details:', error);
            alert('Error loading item details: ' + error.message);
        });
}
