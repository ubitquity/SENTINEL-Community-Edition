/**
 * SENTINEL Express Server Example
 *
 * A complete Express.js server with SENTINEL integration
 */

import express from 'express';
import { Sentinel } from '@neura-help/sentinel-community';

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize SENTINEL
const sentinel = new Sentinel({
  maxInputLength: 10000,
  redactPII: true,
  redactSecrets: true,
  logLevel: 'info'
});

// Middleware
app.use(express.json({ limit: '10mb' }));

// CORS middleware (if needed)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// SENTINEL sanitization middleware (optional - for all routes)
const sanitizeMiddleware = async (req, res, next) => {
  // Skip for health checks
  if (req.path === '/health') {
    return next();
  }

  try {
    // Sanitize request body
    if (req.body && typeof req.body === 'object') {
      for (const [key, value] of Object.entries(req.body)) {
        if (typeof value === 'string') {
          const result = await sentinel.protect(value);

          if (result.threats.length > 0) {
            console.warn(`⚠️  Threats detected in ${key}:`, result.threats);

            // Option 1: Block the request
            // return res.status(400).json({
            //   error: 'Potentially malicious input detected',
            //   threats: result.threats
            // });

            // Option 2: Allow but sanitize and log
          }

          req.body[key] = result.output;
        }
      }
    }
    next();
  } catch (error) {
    console.error('Sentinel middleware error:', error);
    res.status(500).json({ error: 'Security validation failed' });
  }
};

// Uncomment to enable global sanitization
// app.use(sanitizeMiddleware);

// Routes

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  const stats = sentinel.getStats();
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    sentinel: {
      edition: stats.edition,
      totalRequests: stats.totalRequests,
      threatsDetected: stats.threatsDetected
    }
  });
});

/**
 * Protect endpoint - Sanitize input only
 */
app.post('/api/protect', async (req, res) => {
  try {
    const { input } = req.body;

    if (!input) {
      return res.status(400).json({ error: 'Input is required' });
    }

    const result = await sentinel.protect(input);

    res.json({
      original: result.original,
      output: result.output,
      sanitized: result.sanitized,
      changes: result.changes,
      threats: result.threats
    });
  } catch (error) {
    console.error('Protect endpoint error:', error);
    res.status(500).json({ error: 'Failed to process input' });
  }
});

/**
 * Filter endpoint - Filter output only
 */
app.post('/api/filter', async (req, res) => {
  try {
    const { output } = req.body;

    if (!output) {
      return res.status(400).json({ error: 'Output is required' });
    }

    const result = await sentinel.filterOutput(output);

    res.json({
      original: result.original,
      output: result.output,
      filtered: result.filtered,
      redactions: result.redactions
    });
  } catch (error) {
    console.error('Filter endpoint error:', error);
    res.status(500).json({ error: 'Failed to filter output' });
  }
});

/**
 * Chat endpoint - Full pipeline with simulated LLM
 */
app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const result = await sentinel.pipeline(message, async (safeInput) => {
      // Simulate LLM call
      // In production, replace this with your actual LLM integration

      console.log('Calling LLM with safe input:', safeInput);

      // Simulated LLM responses based on input
      if (safeInput.toLowerCase().includes('hello')) {
        return "Hello! I'm a helpful AI assistant. How can I help you today?";
      } else if (safeInput.toLowerCase().includes('credit card')) {
        return "I cannot help with credit card information. For security, your card number is 4532-1234-5678-9010 (this will be redacted).";
      } else if (safeInput.toLowerCase().includes('email')) {
        return "You can contact support at support@example.com";
      } else {
        return "I understand your message. How else can I assist you?";
      }
    });

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    res.json({
      response: result.response,
      metadata: {
        inputThreats: result.inputThreats,
        redactions: result.redactions,
        edition: result.edition
      }
    });
  } catch (error) {
    console.error('Chat endpoint error:', error);
    res.status(500).json({ error: 'Failed to process message' });
  }
});

/**
 * Batch processing endpoint
 */
app.post('/api/batch', async (req, res) => {
  try {
    const { messages } = req.body;

    if (!Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages must be an array' });
    }

    const results = [];

    for (const message of messages) {
      const result = await sentinel.protect(message);
      results.push({
        original: message,
        output: result.output,
        sanitized: result.sanitized,
        threats: result.threats
      });
    }

    const totalThreats = results.reduce((sum, r) => sum + r.threats.length, 0);

    res.json({
      results,
      summary: {
        total: messages.length,
        sanitized: results.filter(r => r.sanitized).length,
        threatsDetected: totalThreats
      }
    });
  } catch (error) {
    console.error('Batch endpoint error:', error);
    res.status(500).json({ error: 'Failed to process batch' });
  }
});

/**
 * Statistics endpoint
 */
app.get('/api/stats', (req, res) => {
  const stats = sentinel.getStats();
  res.json(stats);
});

/**
 * Upgrade info endpoint
 */
app.get('/api/upgrade-info', (req, res) => {
  const info = sentinel.getUpgradeInfo();
  res.json(info);
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║          🛡️ SENTINEL Express Server                           ║
║                                                               ║
║  Server running on port ${PORT}                                  ║
║                                                               ║
║  Available endpoints:                                         ║
║    GET  /health           - Health check                      ║
║    POST /api/protect      - Sanitize input                    ║
║    POST /api/filter       - Filter output                     ║
║    POST /api/chat         - Full chat pipeline                ║
║    POST /api/batch        - Batch processing                  ║
║    GET  /api/stats        - Statistics                        ║
║    GET  /api/upgrade-info - Upgrade information               ║
║                                                               ║
║  Test with:                                                   ║
║    curl -X POST http://localhost:${PORT}/api/chat \\            ║
║      -H "Content-Type: application/json" \\                   ║
║      -d '{"message":"Hello!"}'                                ║
╚═══════════════════════════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  const stats = sentinel.getStats();
  console.log('Final statistics:', stats);
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\nSIGINT received, shutting down gracefully...');
  const stats = sentinel.getStats();
  console.log('Final statistics:', stats);
  process.exit(0);
});

export default app;
