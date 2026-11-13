const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5600;

app.use(express.json({ limit: '5mb' }));

// Disable aggressive caching on HTML/JS/CSS so updates apply immediately
app.use((req, res, next) => {
  if (
    req.path === '/' ||
    req.path.endsWith('.html') ||
    req.path.endsWith('.js') ||
    req.path.endsWith('.css')
  ) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  }
  next();
});

// Serve static frontend and vendor bundles
app.use(express.static(path.join(__dirname, 'public')));

// Health check for Render
app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    service: 'MY BAND',
    timestamp: new Date().toISOString()
  });
});

// Service metadata (ONEID / Helpdesk integration URLs)
app.get('/api/config', (req, res) => {
  res.json({
    serviceName: 'MY BAND',
    oneidUrl: process.env.ONEID_URL || 'https://oneid-ruddy.vercel.app',
    helpdeskUrl:
      process.env.HELPDESK_URL ||
      'https://oneid-helpdesk.onrender.com/?service=MY%20BAND'
  });
});

// Fallback to index.html for SPA routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`MY BAND server running on http://localhost:${PORT}`);
});
