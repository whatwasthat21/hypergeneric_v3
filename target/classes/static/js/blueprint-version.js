// Blueprint Version Management
console.log('Blueprint version management loaded');

// Function to toggle versions visibility
function toggleVersions(blueprintId) {
    console.log('Toggling versions for blueprint ID:', blueprintId);
    
    const versionsRow = document.getElementById(`versions-row-${blueprintId}`);
    if (!versionsRow) {
        console.error(`Versions row not found for blueprint ID ${blueprintId}`);
        return;
    }
    
    const chevron = document.getElementById(`chevron-${blueprintId}`);
    if (chevron) {
        chevron.classList.toggle('fa-chevron-down');
        chevron.classList.toggle('fa-chevron-right');
    }
    
    // Toggle the visibility
    if (versionsRow.classList.contains('d-none')) {
        // Show the versions row
        versionsRow.classList.remove('d-none');
        
        // Check if versions need to be loaded
        const versionsList = versionsRow.querySelector('.versions-list');
        if (versionsList && versionsList.children.length === 0) {
            loadVersions(blueprintId);
        }
    } else {
        // Hide the versions row
        versionsRow.classList.add('d-none');
    }
}

// Function to load versions data
function loadVersions(blueprintId) {
    const versionsRow = document.getElementById(`versions-row-${blueprintId}`);
    const loadingIndicator = versionsRow.querySelector('.versions-loading');
    const versionsList = versionsRow.querySelector('.versions-list');
    
    if (!versionsList || !loadingIndicator) return;
    
    loadingIndicator.classList.remove('d-none');
    
    const csrfHeader = document.querySelector('meta[name="_csrf_header"]').content;
    const csrfToken = document.querySelector('meta[name="_csrf"]').content;
    
    fetch(`/api/blueprints/${blueprintId}/versions`, {
        headers: {
            [csrfHeader]: csrfToken
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(versions => {
        loadingIndicator.classList.add('d-none');
        
        if (!versions || versions.length === 0) {
            versionsList.innerHTML = `
                <div class="alert alert-info">
                    <i class="fas fa-info-circle me-2"></i>
                    No versions available
                </div>
            `;
            return;
        }
        
        // Sort versions by version number (descending)
        versions.sort((a, b) => b.versionNumber - a.versionNumber);
        
        versionsList.innerHTML = `
            <table class="table table-sm table-hover mb-0">
                <thead>
                    <tr>
                        <th>Version</th>
                        <th>Name</th>
                        <th>Description</th>
                        <th>Status</th>
                        <th>Created By</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${versions.map(version => `
                        <tr>
                            <td>${version.versionNumber}</td>
                            <td>${version.name || ''}</td>
                            <td>${version.description || ''}</td>
                            <td>
                                <span class="badge ${version.active ? 'bg-success' : 'bg-secondary'}">
                                    ${version.active ? 'Active' : 'Inactive'}
                                </span>
                            </td>
                            <td>${version.createdBy || ''}</td>
                            <td>
                                <div class="btn-group btn-group-sm">
                                    <button class="btn btn-info view-fields-btn" data-id="${version.id}" onclick="viewFields(${version.id})">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                    ${!version.active ? `
                                        <button class="btn btn-success activate-version-btn" data-id="${version.id}" onclick="activateVersion(${version.id})">
                                            <i class="fas fa-check"></i>
                                        </button>
                                    ` : ''}
                                    <button class="btn btn-danger delete-version-btn" data-id="${version.id}" onclick="deleteBlueprintVersion(${version.id})">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    })
    .catch(error => {
        console.error('Error loading versions:', error);
        loadingIndicator.classList.add('d-none');
        versionsList.innerHTML = `
            <div class="alert alert-danger">
                <i class="fas fa-exclamation-circle me-2"></i>
                Error loading versions: ${error.message}
            </div>
        `;
    });
}

// Version management functions
function createBlueprintVersion(blueprintId) {
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
        loadVersions(blueprintId);
        
        // Hide toast after delay
        setTimeout(() => {
            toast.remove();
        }, 3000);
    })
    .catch(error => {
        console.error('Error creating blueprint version:', error);
        alert(`Error creating version: ${error.message}`);
    });
}

function deleteBlueprintVersion(versionId) {
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
        
        // Reload versions in parent row
        const versionBtn = document.querySelector(`.delete-version-btn[data-id="${versionId}"]`);
        if (versionBtn) {
            const versionsRow = versionBtn.closest('.versions-row');
            if (versionsRow) {
                const blueprintId = versionsRow.id.replace('versions-row-', '');
                loadVersions(blueprintId);
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
}

function viewFields(versionId) {
    window.location.href = `/blueprint-versions/${versionId}/fields`;
}

function activateVersion(versionId) {
    if (!versionId || !confirm('Are you sure you want to set this version as active?')) {
        return;
    }
    
    // Get CSRF token
    const csrfHeader = document.querySelector('meta[name="_csrf_header"]').content;
    const csrfToken = document.querySelector('meta[name="_csrf"]').content;
    
    fetch(`/api/blueprint-versions/${versionId}/activate`, {
        method: 'POST',
        headers: {
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
        
        // Reload versions in parent row
        const versionBtn = document.querySelector(`.activate-version-btn[data-id="${versionId}"]`);
        if (versionBtn) {
            const versionsRow = versionBtn.closest('.versions-row');
            if (versionsRow) {
                const blueprintId = versionsRow.id.replace('versions-row-', '');
                loadVersions(blueprintId);
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
}

// Export functions to global scope
window.toggleVersions = toggleVersions;
window.createBlueprintVersion = createBlueprintVersion;
window.deleteBlueprintVersion = deleteBlueprintVersion;
window.viewFields = viewFields;
window.activateVersion = activateVersion;
