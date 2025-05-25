/**
 * Blueprint Version Management
 * Provides functionality to create, edit, delete, and activate blueprint versions
 * with proper CSRF protection
 */

// Utility function to get CSRF token - use the shared CSRF function if available
function getCsrfToken() {
    console.log('Retrieving CSRF token for version API request');
    
    // First try to use the global function if available (from csrf.js)
    if (typeof window.fetchWithCsrf === 'function') {
        console.log('Using global CSRF utility');
        return null; // We'll use the global function instead
    }
    
    // Try to get token from form field
    const csrfInput = document.querySelector('input[name="_csrf"]');
    if (csrfInput) {
        console.log('Found CSRF token in form input');
        return {
            header: 'X-' + csrfInput.name,
            value: csrfInput.value
        };
    }
    
    // Try to get token from meta tag
    const metaCsrf = document.querySelector('meta[name="_csrf"]');
    const metaCsrfHeader = document.querySelector('meta[name="_csrf_header"]');
    if (metaCsrf && metaCsrfHeader) {
        console.log('Found CSRF token in meta tags');
        return {
            header: metaCsrfHeader.content,
            value: metaCsrf.content
        };
    }
    
    // Try to get token from cookies
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
        if (cookie.startsWith('XSRF-TOKEN=')) {
            const token = decodeURIComponent(cookie.substring('XSRF-TOKEN='.length));
            console.log('Found CSRF token in cookies');
            return {
                header: 'X-XSRF-TOKEN',
                value: token
            };
        }
    }
    
    console.warn('CSRF token not found in form, meta tags, or cookies');
    return {
        header: 'X-XSRF-TOKEN',
        value: ''
    };
}

// Helper function to add CSRF token to fetch options
function addCsrfToFetchOptions(options = {}) {
    const csrf = getCsrfToken();
    
    // Initialize headers if not present
    if (!options.headers) {
        options.headers = {};
    }
    
    // Add CSRF token to headers if we found one
    if (csrf && csrf.header && csrf.value) {
        options.headers[csrf.header] = csrf.value;
    }
    
    // Ensure credentials are included
    options.credentials = 'include';
    
    return options;
}

// Helper function to perform fetch with CSRF token
function fetchWithCsrf(url, options = {}) {
    console.log(`Executing fetchWithCsrf for URL: ${url}`, options);
    
    // Use global CSRF utility if available
    if (typeof window.fetchWithCsrf === 'function') {
        console.log('Using global fetchWithCsrf utility');
        return window.fetchWithCsrf(url, options)
            .then(response => {
                console.log(`Global fetchWithCsrf response for ${url}:`, response);
                return response;
            })
            .catch(error => {
                console.error(`Global fetchWithCsrf error for ${url}:`, error);
                throw error;
            });
    }
    
    // Otherwise use our local implementation
    console.log('Using local fetchWithCsrf implementation');
    const enhancedOptions = addCsrfToFetchOptions(options);
    console.log('Enhanced options with CSRF:', enhancedOptions);
    
    return fetch(url, enhancedOptions)
        .then(response => {
            console.log(`Local fetchWithCsrf response for ${url}:`, response);
            return response;
        })
        .catch(error => {
            console.error(`Local fetchWithCsrf error for ${url}:`, error);
            throw error;
        });
}

// Blueprint Version management functions
function createBlueprintVersion(blueprintId) {
    console.log('Creating blueprint version for blueprint ID:', blueprintId);
    
    // Get form data
    const form = document.getElementById('createVersionForm');
    if (!form) {
        console.error('Create version form not found');
        alert('Error: Form not found. Please refresh the page.');
        return;
    }
    
    console.log('Found create version form:', form);
    
    // Get form data
    const formData = new FormData(form);
    const data = {};
    
    // Convert FormData to JSON object
    formData.forEach((value, key) => {
        // Handle checkboxes specially
        if (key === 'active') {
            data[key] = value === 'on';
        } else {
            data[key] = value;
        }
    });
    
    // Add blueprint ID if not in form
    if (!data.blueprintId && blueprintId) {
        data.blueprintId = Number(blueprintId);
    }
    
    console.log('Submitting blueprint version data:', data);
    
    // Show loading indicator if available
    const submitBtn = document.getElementById('createVersionButton');
    let originalText = 'Create';
    
    if (submitBtn) {
        originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Creating...';
    }
    
    // Track if we should show alert after success
    let showSuccessAlert = true;
    
    // Clear page cache before submission if cache system is available
    if (window.PageCache && typeof PageCache.captureCurrentPageState === 'function') {
        PageCache.captureCurrentPageState();
    }
    
    console.log('About to make API request with fetchWithCsrf');
    console.log('Request payload:', JSON.stringify(data, null, 2));
    
    fetchWithCsrf('/api/blueprint-versions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => {
        if (!response.ok) {
            return response.text().then(text => {
                try {
                    const errorData = JSON.parse(text);
                    throw new Error(errorData.message || `Failed to create version (${response.status})`);
                } catch (e) {
                    if (e instanceof SyntaxError) {
                        throw new Error(`Server error (${response.status}): ${text}`);
                    }
                    throw e;
                }
            });
        }
        return response.json();
    })
    .then(data => {
        console.log('Blueprint version created successfully:', data);
        
        // Clear page cache and trigger success event
        if (window.PageCache) {
            PageCache.clearCurrentPageCache();
            if (typeof triggerAjaxSuccess === 'function') {
                triggerAjaxSuccess({
                    type: 'blueprint-version',
                    action: 'create',
                    data: data
                });
            }
        }
        
        // Show success message
        if (showSuccessAlert) {
            const successAlert = document.createElement('div');
            successAlert.className = 'alert alert-success';
            successAlert.textContent = 'Version created successfully!';
            const modalBody = document.querySelector('#createVersionModal .modal-body');
            if (modalBody) {
                modalBody.prepend(successAlert);
            }
        }
        
        // Close modal and reload page after a short delay
        setTimeout(() => {
            const modal = bootstrap.Modal.getInstance(document.getElementById('createVersionModal'));
            if (modal) {
                modal.hide();
            }
            window.location.reload();
        }, 1000);
    })
    .catch(error => {
        console.error('Error creating blueprint version:', error);
        
        // Show error in the modal
        const errorAlert = document.createElement('div');
        errorAlert.className = 'alert alert-danger';
        errorAlert.textContent = `Error creating version: ${error.message}`;
        
        const modalBody = document.querySelector('#createVersionModal .modal-body');
        if (modalBody) {
            // Remove any existing alerts
            modalBody.querySelectorAll('.alert').forEach(el => el.remove());
            modalBody.prepend(errorAlert);
        } else {
            alert(`Error creating version: ${error.message}`);
        }
    })
    .finally(() => {
        // Reset button state
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    });
}

function updateBlueprintVersion(versionId) {
    console.log('Updating blueprint version ID:', versionId);
    
    // Get form data
    const form = document.getElementById('editVersionForm');
    if (!form) {
        console.error('Edit version form not found');
        alert('Error: Form not found. Please refresh the page.');
        return;
    }
    
    const formData = new FormData(form);
    const data = {};
    
    // Convert FormData to JSON object
    formData.forEach((value, key) => {
        // Handle checkboxes specially
        if (key === 'active') {
            data[key] = value === 'on';
        } else {
            data[key] = value;
        }
    });
    
    // Ensure version ID is included
    data.id = Number(versionId);
    
    console.log('Submitting updated blueprint version data:', data);
    
    // Show loading indicator if available
    const submitBtn = document.getElementById('updateVersionButton');
    let originalText = 'Save Changes';
    
    if (submitBtn) {
        originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Saving...';
    }
    
    // Track if we should show alert after success
    let showSuccessAlert = true;
    
    // Clear page cache before submission if cache system is available
    if (window.PageCache && typeof PageCache.captureCurrentPageState === 'function') {
        PageCache.captureCurrentPageState();
    }
    
    fetchWithCsrf(`/api/blueprint-versions/${versionId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => {
        if (!response.ok) {
            return response.text().then(text => {
                try {
                    const errorData = JSON.parse(text);
                    throw new Error(errorData.message || `Failed to update version (${response.status})`);
                } catch (e) {
                    if (e instanceof SyntaxError) {
                        throw new Error(`Server error (${response.status}): ${text}`);
                    }
                    throw e;
                }
            });
        }
        return response.json();
    })
    .then(data => {
        console.log('Blueprint version updated successfully:', data);
        
        // Clear page cache and trigger success event
        if (window.PageCache) {
            PageCache.clearCurrentPageCache();
            if (typeof triggerAjaxSuccess === 'function') {
                triggerAjaxSuccess({
                    type: 'blueprint-version',
                    action: 'update',
                    data: data
                });
            }
        }
        
        // Show success message
        if (showSuccessAlert) {
            const successAlert = document.createElement('div');
            successAlert.className = 'alert alert-success';
            successAlert.textContent = 'Version updated successfully!';
            const modalBody = document.querySelector('#editVersionModal .modal-body');
            if (modalBody) {
                modalBody.prepend(successAlert);
            }
        }
        
        // Close modal and reload page after a short delay
        setTimeout(() => {
            const modal = bootstrap.Modal.getInstance(document.getElementById('editVersionModal'));
            if (modal) {
                modal.hide();
            }
            window.location.reload();
        }, 1000);
    })
    .catch(error => {
        console.error('Error updating blueprint version:', error);
        
        // Show error in the modal
        const errorAlert = document.createElement('div');
        errorAlert.className = 'alert alert-danger';
        errorAlert.textContent = `Error updating version: ${error.message}`;
        
        const modalBody = document.querySelector('#editVersionModal .modal-body');
        if (modalBody) {
            // Remove any existing alerts
            modalBody.querySelectorAll('.alert').forEach(el => el.remove());
            modalBody.prepend(errorAlert);
        } else {
            alert(`Error updating version: ${error.message}`);
        }
    })
    .finally(() => {
        // Reset button state
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    });
}

function deleteBlueprintVersion(versionId) {
    console.log('Attempting to delete blueprint version ID:', versionId);
    
    if (!versionId) {
        console.error('No version ID provided for deletion');
        return;
    }
    
    // Show confirmation dialog with version details if possible
    const confirmMessage = 'Are you sure you want to delete this blueprint version? This action cannot be undone.';
    
    if (confirm(confirmMessage)) {
        console.log('Delete confirmed for version ID:', versionId);
        
        // Find delete button to show loading state
        let deleteBtn;
        document.querySelectorAll('.delete-version-btn').forEach(btn => {
            if (btn.getAttribute('data-id') === String(versionId)) {
                deleteBtn = btn;
            }
        });
        
        // Store original HTML and show loading state
        let originalHtml;
        if (deleteBtn) {
            originalHtml = deleteBtn.innerHTML;
            deleteBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>';
            deleteBtn.disabled = true;
        }
        
        // Clear page cache if available
        if (window.PageCache && typeof PageCache.captureCurrentPageState === 'function') {
            PageCache.captureCurrentPageState();
        }
        
        fetchWithCsrf(`/api/blueprint-versions/${versionId}`, {
            method: 'DELETE',
            credentials: 'include'
        })
        .then(response => {
            if (!response.ok) {
                return response.text().then(text => {
                    try {
                        const errorData = JSON.parse(text);
                        throw new Error(errorData.message || `Failed to delete version (${response.status})`);
                    } catch (e) {
                        if (e instanceof SyntaxError) {
                            throw new Error(`Server error (${response.status}): ${text}`);
                        }
                        throw e;
                    }
                });
            }
            
            console.log('Blueprint version deleted successfully');
            
            // Clear page cache and trigger success event
            if (window.PageCache) {
                PageCache.clearCurrentPageCache();
                if (typeof triggerAjaxSuccess === 'function') {
                    triggerAjaxSuccess({
                        type: 'blueprint-version',
                        action: 'delete',
                        data: { id: versionId }
                    });
                }
            }
            
            // Show temporary success message
            const successToast = document.createElement('div');
            successToast.className = 'position-fixed bottom-0 end-0 p-3 toast show';
            successToast.style.zIndex = '11';
            successToast.innerHTML = `
                <div class="toast-header bg-success text-white">
                    <strong class="me-auto">Success</strong>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast" aria-label="Close"></button>
                </div>
                <div class="toast-body">
                    Version deleted successfully.
                </div>
            `;
            document.body.appendChild(successToast);
            
            // Remove toast after 3 seconds
            setTimeout(() => {
                successToast.remove();
                // Reload page to update the UI
                window.location.reload();
            }, 1500);
        })
        .catch(error => {
            console.error('Error deleting blueprint version:', error);
            
            // Reset delete button if available
            if (deleteBtn && originalHtml) {
                deleteBtn.innerHTML = originalHtml;
                deleteBtn.disabled = false;
            }
            
            // Show error message
            alert(`Error deleting version: ${error.message}`);
        });
    } else {
        console.log('Delete cancelled for version ID:', versionId);
    }
}

// Helper function for navigating to version fields
function viewFields(versionId) {
    if (!versionId) {
        console.error('No version ID provided for viewing fields');
        return;
    }
    window.location.href = `/blueprint-versions/${versionId}/fields`;
}

// Helper function for activating a version
function activateVersion(versionId) {
    console.log('Activating blueprint version ID:', versionId);
    
    if (!versionId) {
        console.error('No version ID provided for activation');
        return;
    }
    
    if (confirm('Are you sure you want to set this version as active?')) {
        // Find activate button to show loading state
        let activateBtn;
        document.querySelectorAll('.activate-version-btn').forEach(btn => {
            if (btn.getAttribute('data-id') === String(versionId)) {
                activateBtn = btn;
            }
        });
        
        // Store original HTML and show loading state
        let originalHtml;
        if (activateBtn) {
            originalHtml = activateBtn.innerHTML;
            activateBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>';
            activateBtn.disabled = true;
        }
        
        // Clear page cache if available
        if (window.PageCache && typeof PageCache.captureCurrentPageState === 'function') {
            PageCache.captureCurrentPageState();
        }
        
        fetchWithCsrf(`/api/blueprint-versions/${versionId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ active: true })
        })
        .then(response => {
            if (!response.ok) {
                return response.text().then(text => {
                    try {
                        const errorData = JSON.parse(text);
                        throw new Error(errorData.message || `Failed to activate version (${response.status})`);
                    } catch (e) {
                        if (e instanceof SyntaxError) {
                            throw new Error(`Server error (${response.status}): ${text}`);
                        }
                        throw e;
                    }
                });
            }
            
            console.log('Blueprint version activated successfully');
            
            // Clear page cache and trigger success event
            if (window.PageCache) {
                PageCache.clearCurrentPageCache();
                if (typeof triggerAjaxSuccess === 'function') {
                    triggerAjaxSuccess({
                        type: 'blueprint-version',
                        action: 'activate',
                        data: { id: versionId }
                    });
                }
            }
            
            // Show temporary success message
            const successToast = document.createElement('div');
            successToast.className = 'position-fixed bottom-0 end-0 p-3 toast show';
            successToast.style.zIndex = '11';
            successToast.innerHTML = `
                <div class="toast-header bg-success text-white">
                    <strong class="me-auto">Success</strong>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast" aria-label="Close"></button>
                </div>
                <div class="toast-body">
                    Version activated successfully.
                </div>
            `;
            document.body.appendChild(successToast);
            
            // Remove toast and reload page after a short delay
            setTimeout(() => {
                successToast.remove();
                window.location.reload();
            }, 1500);
        })
        .catch(error => {
            console.error('Error activating blueprint version:', error);
            
            // Reset button if available
            if (activateBtn && originalHtml) {
                activateBtn.innerHTML = originalHtml;
                activateBtn.disabled = false;
            }
            
            // Show error message
            alert(`Error activating version: ${error.message}`);
        });
    }
}

// Make functions globally available for use by inline scripts
window.createBlueprintVersion = createBlueprintVersion;
window.updateBlueprintVersion = updateBlueprintVersion;
window.deleteBlueprintVersion = deleteBlueprintVersion;
window.viewFields = viewFields;
window.activateVersion = activateVersion;

// Immediately indicate script has loaded
console.log('Blueprint Version management script loaded - functions exported to global scope');

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    console.log('Blueprint Version management initialized with CSRF protection');
    
    // Add a visual indicator that this script is properly loaded
    const versionHeaders = document.querySelectorAll('.card-title');
    for (const header of versionHeaders) {
        if (header.textContent.includes('Versions')) {
            const statusDiv = document.createElement('div');
            statusDiv.className = 'mt-2 mb-2 text-success small';
            statusDiv.innerText = 'Version management active';
            header.parentElement.appendChild(statusDiv);
            break;
        }
    }
    
    // Note: Not attaching event listener to createVersionButton
    // Using the inline onclick handler instead to avoid conflicts
    
    // Add event listeners for delete version buttons
    document.querySelectorAll('.delete-version-btn').forEach(button => {
        button.addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            if (id) {
                deleteBlueprintVersion(id);
            }
        });
    });
    
    // Add event listeners for activate version buttons
    document.querySelectorAll('.activate-version-btn').forEach(button => {
        button.addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            if (id) {
                activateVersion(id);
            }
        });
    });
    
    // Add event listeners for view fields buttons
    document.querySelectorAll('.view-fields-btn').forEach(button => {
        button.addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            if (id) {
                viewFields(id);
            }
        });
    });
    
    // Set up edit version modal
    const editVersionModal = document.getElementById('editVersionModal');
    if (editVersionModal) {
        // Initialize Bootstrap modal if needed
        if (typeof bootstrap !== 'undefined') {
            const modal = new bootstrap.Modal(editVersionModal);
            
            // Handle modal reset when closed
            editVersionModal.addEventListener('hidden.bs.modal', function() {
                // Clear form and remove any alerts
                const form = document.getElementById('editVersionForm');
                if (form) {
                    form.reset();
                }
                
                const alerts = editVersionModal.querySelectorAll('.alert');
                alerts.forEach(alert => alert.remove());
            });
        }
        
        // Add event listeners for edit version buttons
        document.querySelectorAll('[data-bs-target="#editVersionModal"]').forEach(button => {
            button.addEventListener('click', function() {
                // Get version data from data attributes
                const id = this.getAttribute('data-id') || this.getAttribute('th:data-id');
                const name = this.getAttribute('data-name') || this.getAttribute('th:data-name');
                const description = this.getAttribute('data-description') || this.getAttribute('th:data-description');
                const active = this.getAttribute('data-active') === 'true' || 
                               this.getAttribute('th:data-active') === 'true';
                
                // Populate form fields
                const editForm = document.getElementById('editVersionForm');
                if (editForm) {
                    const idField = document.getElementById('editVersionId');
                    const nameField = document.getElementById('editVersionName');
                    const descriptionField = document.getElementById('editVersionDescription');
                    const activeField = document.getElementById('editIsActive');
                    
                    if (idField) idField.value = id;
                    if (nameField) nameField.value = name;
                    if (descriptionField) descriptionField.value = description;
                    if (activeField) activeField.checked = active;
                }
            });
        });
        
        // Add event listener for update version button
        const updateVersionBtn = document.getElementById('updateVersionButton');
        if (updateVersionBtn) {
            updateVersionBtn.addEventListener('click', function() {
                const versionId = document.getElementById('editVersionId').value;
                updateBlueprintVersion(versionId);
            });
        }
    }
    
    // Initialize tooltips if Bootstrap is available
    if (typeof bootstrap !== 'undefined' && typeof bootstrap.Tooltip !== 'undefined') {
        const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        tooltipTriggerList.map(function(tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl);
        });
    }
});
