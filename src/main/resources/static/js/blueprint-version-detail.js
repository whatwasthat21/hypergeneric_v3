function viewVersionDetails(blueprintId, versionId) {
    window.location.href = `/blueprints/${blueprintId}/versions/${versionId}`;
}

function loadVersions(blueprintId) {
    const versionsList = document.querySelector(`#versions-row-${blueprintId} .versions-list`);
    const loadingIndicator = document.querySelector(`#versions-row-${blueprintId} .versions-loading`);
    
    if (!versionsList || !loadingIndicator) return;
    
    loadingIndicator.classList.remove('d-none');
    
    fetch(`/api/blueprints/${blueprintId}/versions`)
        .then(response => response.json())
        .then(versions => {
            versionsList.innerHTML = versions.map(version => `
                <tr>
                    <td>${version.versionNumber}</td>
                    <td>${version.name || ''}</td>
                    <td>${version.description || ''}</td>
                    <td>${version.status || ''}</td>
                    <td>${version.createdBy || ''}</td>
                    <td>
                        <button class="btn btn-sm btn-info" onclick="viewVersionDetails(${blueprintId}, ${version.id})">
                            <i class="fas fa-eye"></i> View Details
                        </button>
                    </td>
                </tr>
            `).join('');
        })
        .catch(error => {
            console.error('Error loading versions:', error);
            versionsList.innerHTML = '<tr><td colspan="6" class="text-center text-danger">Error loading versions</td></tr>';
        })
        .finally(() => {
            loadingIndicator.classList.add('d-none');
        });
}
