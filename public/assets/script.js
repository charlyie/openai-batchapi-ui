let autoRefresh = JSON.parse(localStorage.getItem('autoRefresh')) ?? false;
let filterLast24Hours = JSON.parse(localStorage.getItem('filterLast24Hours')) ?? false;
let refreshInterval = null;

document.getElementById('autoRefresh').checked = autoRefresh;
document.getElementById('last24Hours').checked = filterLast24Hours;

document.getElementById('autoRefresh').addEventListener('change', (e) => {
    autoRefresh = e.target.checked;
    localStorage.setItem('autoRefresh', autoRefresh);
    if (autoRefresh) {
        startAutoRefresh();
    } else {
        stopAutoRefresh();
    }
});

document.getElementById('last24Hours').addEventListener('change', (e) => {
    filterLast24Hours = e.target.checked;
    localStorage.setItem('filterLast24Hours', filterLast24Hours);
    fetchBatches();
});

document.getElementById('modal-close').addEventListener('click', () => {
    closeModal();
});

document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        closeModal();
    }
});

function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `px-4 py-2 rounded text-white text-center shadow-lg ${
                type === 'error' ? 'bg-red-500' : 'bg-blue-500'
            }`;
    toast.style.boxShadow = '5px 5px 5px rgba(0, 0, 0, 0.2), 0 1px 3px rgba(0, 0, 0, 0.06)';
    toast.textContent = message;

    toastContainer.appendChild(toast);
    setTimeout(() => {
        toast.remove();
    }, 5000);
}


function closeModal() {
    document.getElementById('modal').style.display = 'none';
    document.getElementById('modal-content').textContent = '';
}

window.onload = () => {
    const storedApiKey = localStorage.getItem('openaiApiKey');
    if (storedApiKey) {
        document.getElementById('apiKey').value = storedApiKey;
    }
    startAutoRefresh();
};

function fetchBatches() {
    const apiKey = document.getElementById('apiKey').value;

    if (!apiKey) {
        showToast('Please enter your API key!', 'error');
        return;
    }

    localStorage.setItem('openaiApiKey', apiKey);

    fetch('/api/get-batches', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                apiKey,
                filterLast24Hours
            })
        })
        .then(response => response.json())
        .then(data => {
            const container = document.getElementById('batchesContainer');
            container.innerHTML = '';

            if (data.error) {
                showToast(`Error: ${data.error}`, 'error');
                return;
            }

            if (data.data && Array.isArray(data.data)) {
                let tableHtml = '<div class="table-container"><table><thead><tr>';
                tableHtml += '<th>ID</th><th>Status</th><th>Progression</th><th>Created at</th><th>Completed at</th><th>Actions</th>';
                tableHtml += '</tr></thead><tbody>';

                data.data.forEach(batch => {
                    const createdAt = new Date(batch.created_at * 1000).toLocaleDateString();
                    const createdAt_time = new Date(batch.created_at * 1000).toLocaleTimeString();
                    const completedAt = batch.completed_at ? new Date(batch.completed_at * 1000).toLocaleDateString() : 'N/A';
                    const completedAt_time = batch.completed_at ? new Date(batch.completed_at * 1000).toLocaleTimeString() : '';
                    const actions = [];

                    let tooltip = '';

                    if (batch.status === 'failed') {
                        tooltip = batch.errors?.data?.map(err => err.message).join('\n') || 'Unknown failure';
                    }

                    if (batch.input_file_id) {
                        actions.push(`<button onclick="showFileContent('${batch.input_file_id}', 'Input File')" class="px-4 py-2 button rounded">⬇️ Input File</button>`);
                    }

                    if (batch.status === 'completed' && batch.output_file_id) {
                        actions.push(`<button onclick="showFileContent('${batch.output_file_id}', 'Output File')" class="px-4 py-2 button rounded">⬆️ Output File</button>`);
                    }

                    if (batch.status === 'in_progress' || batch.status === 'validating') {
                        actions.push(`<button onclick="cancelBatch('${batch.id}')" class="px-4 py-2 button rounded">Cancel Batch</button>`);
                    }

                    const completed = batch.request_counts?.completed || 0;
                    const total = batch.request_counts?.total || 0;
                    const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);

                    tableHtml += `
                        <tr>
                        <td class="tooltip">
                            ${batch.id}
                            <span class="tooltiptext text-sm normal-case font-mono">${formatMetadata(batch.metadata)}</span>
                        </td>
                        <td class="tooltip text-center uppercase status-${batch.status}">
                            ${batch.status}
                            ${tooltip ? `<span class="tooltiptext text-sm normal-case font-mono">${tooltip}</span>` : ''}
                            ${
                            batch.status === 'cancelled' && batch.cancelled_at
                                ? `<span class="tooltiptext text-sm normal-case font-mono">Cancelled At: ${new Date(batch.cancelled_at * 1000).toLocaleString()}</span>`
                                : ''
                            }
                        </td>
                        <td class="tooltip">
                            <p class="percentage text-center">${percentage}%</p>
                            <p class="precision text-center font-mono">
                            ${batch.request_counts?.completed || 0} Completed, 
                            ${batch.request_counts?.failed || 0} Failed, 
                            ${batch.request_counts?.total || 0} Total
                            </p>
                        </td>
                        <td class="text-center"><p>${createdAt}</p><p>${createdAt_time}</p></td>
                        <td class="text-center"><p>${completedAt}</p><p>${completedAt_time}</p></td>
                        <td>${actions.join(' ')}</td>
                        </tr>
                        `;

                });
                if (data.data.length === 0) {
                    tableHtml += '<tr><td colspan="6" class="text-center italic">No batches found</td></tr>';
                }

                tableHtml += '</tbody></table></div>';
                container.innerHTML = tableHtml;
            } else {
                container.innerHTML = `<p>No batches found or invalid response structure.</p>`;
            }
        })
        .catch(error => {
            console.error(error);
            showToast('An error occurred while fetching batches.', 'error');
        });
}

function cancelBatch(batchId) {
    const apiKey = localStorage.getItem('openaiApiKey');
    if (!apiKey) {
        showToast('API Key is required to cancel the batch.', 'error');
        return;
    }

    fetch(`/api/cancel-batch/${batchId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                apiKey
            })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Failed to cancel batch: ${response.statusText}`);
            }
            showToast('Batch cancelled successfully!');
            fetchBatches();
        })
        .catch(error => {
            showToast(`Error cancelling batch: ${error.message}`, 'error');
        });
}

function startAutoRefresh() {
    stopAutoRefresh(); // Clear any existing intervals
    fetchBatches(); // Fetch immediately
    refreshInterval = setInterval(() => {
        if (autoRefresh) {
            fetchBatches();
        }
    }, 10000); // Refresh every 10 seconds
}

function stopAutoRefresh() {
    if (refreshInterval) {
        clearInterval(refreshInterval);
        refreshInterval = null;
    }
}

function showFileContent(fileId, fileType) {
    const apiKey = localStorage.getItem('openaiApiKey');

    if (!apiKey) {
        showToast('API Key is required to fetch file content.', 'error');

        return;
    }

    fetch(`/api/get-file/${fileId}?apiKey=${apiKey}`)
        .then(response => response.json())
        .then(data => {
            const modal = document.getElementById('modal');
            const modalContent = document.getElementById('modal-content');
            if (data.content) {
                const lines = data.content.split('\n');
                const beautifiedLines = lines.map((line, index) => {
                    try {
                        const json = JSON.stringify(JSON.parse(line), null, 2);
                        return `<div><span class="line-number">${index + 1}</span> <code class="hljs">${hljs.highlight(json, { language: 'json' }).value}</code></div>`;
                    } catch (e) {
                        return `<div><span class="line-number">${index + 1}</span> Invalid JSON</div>`;
                    }
                }).join('');
                modalContent.innerHTML = beautifiedLines;
                modal.style.display = 'flex';
            } else {
                showToast(`No content found for ${fileType}.`, 'error');
            }
        })
        .catch(error => {
            console.error(error);
            showToast(`An error occurred while fetching the ${fileType}.`, 'error');
        });
}

function formatMetadata(metadata) {
    if (!metadata) return 'No metadata available';
    const ul = document.createElement('ul');

    for (const [key, value] of Object.entries(metadata)) {
        const li = document.createElement('li');
        li.textContent = `${key} : ${value}`;
        ul.appendChild(li);
    }
    return ul.outerHTML;
}