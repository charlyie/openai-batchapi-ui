const express = require('express');
const path = require('path');
const fetch = require('node-fetch');

const app = express();
const PORT = 3000;

// Middleware to serve static files
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Endpoint to get all batches
app.post('/api/get-batches', async (req, res) => {
    const { apiKey } = req.body;
    const { filterLast24Hours } = req.body;

    if (!apiKey) {
        return res.status(400).json({ error: 'API Key is required' });
    }

    try {
        const response = await fetch('https://api.openai.com/v1/batches', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Error fetching batches: ${response.statusText}`);
        }

        const data = await response.json();
        let batches = data.data;
        
        if (filterLast24Hours) {
            const now = Date.now() / 1000;
            const oneDayMs = 1 * 24 * 60 * 60; 

            // Filter batches created in the last 24 hours
            batches = batches.filter(batch => {
                const createdAt = new Date(batch.created_at).getTime();
                return (now - createdAt) <= oneDayMs;
            });
        }

        res.json({ data: batches });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Endpoint to cancel a new batch
app.post('/api/cancel-batch/:batchId', async (req, res) => {
    const { apiKey } = req.body;
    const { batchId } = req.params;

    if (!apiKey) {
        return res.status(400).json({ error: 'API Key is required' });
    }

    try {
        const response = await fetch(`https://api.openai.com/v1/batches/${batchId}/cancel`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Error cancelling batch: ${response.statusText}`);
        }
        
        res.json({ message: 'Batch cancelled successfully.' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Endpoint to get a file content by fileId
app.get('/api/get-file/:fileId', async (req, res) => {
    const { apiKey } = req.query;
    const { fileId } = req.params;

    if (!apiKey) {
        return res.status(400).json({ error: 'API Key is required' });
    }

    try {
        const response = await fetch(`https://api.openai.com/v1/files/${fileId}/content`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${apiKey}`
            }
        });

        if (!response.ok) {
            throw new Error(`Error fetching file content: ${response.statusText}`);
        }

        const fileContent = await response.text();
        res.json({ content: fileContent });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Route to display the web interface
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
