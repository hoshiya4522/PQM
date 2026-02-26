const app = require('./app');
const path = require('path');
const express = require('express');
const logger = require('./logger');

const PORT = process.env.PORT || 5000;

// Serve React Frontend (Production Mode)
const clientBuildPath = path.join(__dirname, '../client/dist');

// Handle React Routing, return all requests to React app
// IMPORTANT: This must be registered AFTER all API routes which are already in 'app'
app.use(express.static(clientBuildPath));

app.get(/.*/, (req, res) => {
    // Skip API requests and Uploads (they should have been handled by 'app' already)
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
         return res.status(404).json({ error: 'Not found' });
    }
    // Only serve index.html if the build exists
    if (require('fs').existsSync(path.join(clientBuildPath, 'index.html'))) {
        res.sendFile(path.join(clientBuildPath, 'index.html'));
    } else {
        // If we are in dev mode, app.js might not have dist/ index.html,
        // but that's okay because Vite serves the frontend on 5173.
        res.status(404).json({ error: 'Not found' });
    }
});

app.listen(PORT, '0.0.0.0', () => {
  logger.info(`Server running on http://0.0.0.0:${PORT}`);
});