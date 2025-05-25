// Blueprint Version Management
console.log('Blueprint version management loaded');

// Version-specific operations
(function(window) {
    'use strict';

    // Version management functions
    window.createBlueprintVersion = function(blueprintId) {
        console.log('Creating blueprint version for blueprint ID:', blueprintId);
        
        const form = document.getElementById('createVersionForm');
        if (!form) {
            console.error('Create version form not found');
            return;
        }
        
        const formData = new FormData(form);
        const data = {
            blueprintId: Number(blueprintId)
        };
        
        formData.forEach((value, key) => {
            if (key === 'active') {
                data[key] = value === 'on';
            } else {
                data[key] = value;
            }
        });
        
        // Get CSRF token
        const csrfHeader = document.querySelector('meta[name="_csrf_header"]').content;
        const csrfToken = document.querySelector('meta[name="_csrf"]').content;
          fetch('/api/blueprint-versions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                [csrfHeader]: csrfToken
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
                        throw new Error(`Server error (${response.status}): ${text}`);
                    }
                });
            }
            return response.json();
        })
        .then(data => {
            console.log('Blueprint version created successfully:', data);
            
            // Show success message
            const toast = document.createElement('div');
            toast.className = 'position-fixed bottom-0 end-0 p-3 toast show';
            toast.style.zIndex = '11';
            toast.innerHTML = `
                <div class="toast-header bg-success text-white">
                    <strong class="me-auto">Success</strong>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast"></button>
                </div>
                <div class="toast-body">
                    Version created successfully!
                </div>
            `;
            document.body.appendChild(toast);
            
            // Clear form
            form.reset();
            
            // Reload versions
            if (window.loadVersions) {
                window.loadVersions(blueprintId);
            } else if (window.toggleVersions) {
                // Force reload by toggling twice
                window.toggleVersions(blueprintId);
                window.toggleVersions(blueprintId);
            }
            
            // Hide toast after delay
            setTimeout(() => {
                toast.remove();
            }, 3000);
        })
        .catch(error => {
            console.error('Error creating blueprint version:', error);
            alert(`Error creating version: ${error.message}`);
        });
    };
    
    window.deleteBlueprintVersion = function(versionId) {
        if (!versionId || !confirm('Are you sure you want to delete this version? This action cannot be undone.')) {
            return;
        }
        
        // Get CSRF token
        const csrfHeader = document.querySelector('meta[name="_csrf_header"]').content;
        const csrfToken = document.querySelector('meta[name="_csrf"]').content;
        
        fetch(`/api/blueprint-versions/${versionId}`, {
            method: 'DELETE',
            headers: {
                [csrfHeader]: csrfToken
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to delete version');
            }
            
            // Show success message
            const toast = document.createElement('div');
            toast.className = 'position-fixed bottom-0 end-0 p-3 toast show';
            toast.style.zIndex = '11';
            toast.innerHTML = `
                <div class="toast-header bg-success text-white">
                    <strong class="me-auto">Success</strong>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast"></button>
                </div>
                <div class="toast-body">
                    Version deleted successfully!
                </div>
            `;
            document.body.appendChild(toast);
            
            // Find the row the button was in to get the blueprint ID
            const versionBtn = document.querySelector(`.delete-version-btn[data-id="${versionId}"]`);
            if (versionBtn) {
                const versionsRow = versionBtn.closest('.versions-row');
                if (versionsRow) {
                    const blueprintId = versionsRow.id.replace('versions-row-', '');
                    
                    // Reload versions
                    if (window.loadVersions) {
                        window.loadVersions(blueprintId);
                    } else if (window.toggleVersions) {
                        // Force reload by toggling twice
                        window.toggleVersions(blueprintId);
                        window.toggleVersions(blueprintId);
                    }
                }
            }
            
            // Remove toast after delay
            setTimeout(() => {
                toast.remove();
            }, 3000);
        })
        .catch(error => {
            console.error('Error deleting version:', error);
            alert(`Error deleting version: ${error.message}`);
        });
    };
    
    window.viewFields = function(versionId) {
        window.location.href = `/blueprint-versions/${versionId}/fields`;
    };
    
    window.activateVersion = function(versionId) {
        if (!versionId || !confirm('Are you sure you want to set this version as active?')) {
            return;
        }
        
        // Get CSRF token
        const csrfHeader = document.querySelector('meta[name="_csrf_header"]').content;
        const csrfToken = document.querySelector('meta[name="_csrf"]').content;
          fetch(`/api/blueprint-versions/${versionId}/activate`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                [csrfHeader]: csrfToken
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to activate version');
            }
            
            // Show success message
            const toast = document.createElement('div');
            toast.className = 'position-fixed bottom-0 end-0 p-3 toast show';
            toast.style.zIndex = '11';
            toast.innerHTML = `
                <div class="toast-header bg-success text-white">
                    <strong class="me-auto">Success</strong>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast"></button>
                </div>
                <div class="toast-body">
                    Version activated successfully!
                </div>
            `;
            document.body.appendChild(toast);
            
            // Find the row the button was in to get the blueprint ID
            const versionBtn = document.querySelector(`.activate-version-btn[data-id="${versionId}"]`);
            if (versionBtn) {
                const versionsRow = versionBtn.closest('.versions-row');
                if (versionsRow) {
                    const blueprintId = versionsRow.id.replace('versions-row-', '');
                    
                    // Reload versions
                    if (window.loadVersions) {
                        window.loadVersions(blueprintId);
                    } else if (window.toggleVersions) {
                        // Force reload by toggling twice
                        window.toggleVersions(blueprintId);
                        window.toggleVersions(blueprintId);
                    }
                }
            }
            
            // Remove toast after delay
            setTimeout(() => {
                toast.remove();
            }, 3000);
        })
        .catch(error => {
            console.error('Error activating version:', error);
            alert(`Error activating version: ${error.message}`);
        });
    };
    
    window.submitCreateBlueprintVersion = function(event) {
        event.preventDefault();
        
        const form = event.target.closest('form');
        if (!form) {
            console.error('Form not found');
            return false;
        }
        
        // Get blueprint ID from the hidden input
        const blueprintId = form.querySelector('[id^="versionBlueprintId-"]').value;
        if (!blueprintId) {
            console.error('Blueprint ID not found');
            return false;
        }
        
        window.createBlueprintVersion(blueprintId);
        return false;
    };
    
    // Initialize when document is ready
    if (document.readyState !== 'loading') {
        // Document already loaded
        console.log('Version manager initialized');
    } else if (document.addEventListener) {
        document.addEventListener('DOMContentLoaded', function() {
            console.log('Version manager initialized');
        });
    } else {
        window.attachEvent('onload', function() {
            console.log('Version manager initialized');
        });
    }

})(window);
